# デプロイ手順（自分のCloudflareアカウントへ）

このアプリは Next.js + Cloudflare Workers（D1 / R2）で動きます。テナント分離はしていないので、**利用者ごとに自分のCloudflareアカウントへ1つデプロイする**構成を想定しています。

## 0. 前提

- Cloudflareアカウント（無料プランでも可）
- Node.js 20以上、[Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)（`npm i -g wrangler` または `npx wrangler` でも可）
- Stripeアカウント（決済機能を使う場合）

## 1. リポジトリを取得してログイン

```bash
git clone <このリポジトリのURL>
cd <ディレクトリ>
npm install
npx wrangler login
```

## 2. D1データベースとR2バケットを作成

```bash
npx wrangler d1 create greed-learning-db
npx wrangler r2 bucket create greed-learning-assets
```

`wrangler d1 create` の出力に表示される `database_id` を、`wrangler.toml` の `[[d1_databases]]` の該当行に貼り替えてください（**この1行だけ**を書き換えます。`main` や `[assets]` など他の項目はビルド成果物の場所を指しているので、そのままにしてください）。

```toml
[[d1_databases]]
binding = "DB"
database_name = "greed-learning-db"
database_id = "ここに出力されたIDを貼る"   # ← ここだけ書き換える
migrations_dir = "./src/db/migrations"
```

## 3. マイグレーションを本番DBに適用

```bash
npx wrangler d1 migrations apply greed-learning-db --remote
```

## 4. シークレットを設定

`.env.example` を参考に、以下をCloudflareのシークレットとして登録します（`.env`はローカル開発用で本番には反映されません）。

```bash
npx wrangler secret put BETTER_AUTH_SECRET   # openssl rand -base64 32 の出力などを使う
npx wrangler secret put BETTER_AUTH_URL      # 例: https://your-domain.workers.dev
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put RESEND_API_KEY       # https://resend.com で取得。未設定の場合、パスワード再設定メール等は送信されずログ出力のみになります
npx wrangler secret put RESEND_FROM_EMAIL    # 例: no-reply@your-domain.com（Resend側でドメイン認証が必要）
```

`NEXT_PUBLIC_APP_URL` はビルド時に埋め込まれる値なので、`wrangler.toml` の `[vars]` に追加するか、デプロイ前に環境変数として設定してビルドしてください。

Googleログインを使う場合は `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` も同様に設定します（未設定でもメール/パスワードログインのみで動作します）。

## 5. ビルド＆デプロイ

### 方法A: GitHub Actionsで自動デプロイ（推奨）

`.github/workflows/deploy.yml` が同梱されており、リポジトリの **デフォルトブランチにpush（≒このPRがマージされたタイミング）** で自動的にビルド・マイグレーション適用・デプロイまで実行されます。

セットアップは以下だけです（GitHubリポジトリの Settings → Secrets and variables → Actions で登録）。

**Secrets（暗号化され、誰にも見えません）:**

| 名前 | 内容 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflareダッシュボード → My Profile → API Tokens → Create Token。「Edit Cloudflare Workers」テンプレート、または Workers Scripts / D1 / R2 の編集権限を持つカスタムトークンを発行してください |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflareダッシュボードの右サイドバーに表示されるアカウントID |

**Variables（暗号化されない、ビルドに埋め込まれる値）:**

| 名前 | 内容 |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | 本番URL。独自ドメイン未設定なら `https://greed-learning.<アカウントのサブドメイン>.workers.dev`（サブドメインは Cloudflareダッシュボード → Workers & Pages → 右側の「Your subdomain」で確認できます） |

登録後、デフォルトブランチにpushすると Actions タブでビルド〜デプロイの進行状況を確認できます。手動で今すぐ実行したい場合は Actions タブから `Deploy to Cloudflare` ワークフローを選び「Run workflow」でも起動できます。

ワークフローは最初に **Preflight** で必須設定の有無を確認し、足りなければビルド前に分かりやすいエラーで停止します。また `Ensure Cloudflare resources exist` で、D1データベースの存在確認（無ければエラー）とR2バケットの自動作成を行います。

> **先に「2. D1データベースとR2バケットを作成」を必ず済ませてください。** D1だけは自動作成しません。`database_id` がアカウントごとに変わり、`wrangler.toml` と食い違ったまま自動作成すると、アプリが空のDBを向いたまま「デプロイは成功しているのに何も動かない」状態になるためです。

`NEXT_PUBLIC_APP_URL` は未設定でもデプロイ自体は成功しますが、認証コールバックやStripeのリダイレクト先が不安定になるため設定を推奨します。初回デプロイでURLが確定してから設定し、もう一度ワークフローを流す形でも問題ありません（その場合 `BETTER_AUTH_URL` シークレットを設定すれば認証だけは即座に正しくなります）。

#### アプリ実行時のシークレットもGitHubから同期できます

上記2つはデプロイ用ですが、アプリ実行時に使うシークレット（認証・Stripe・メール）も、同じ画面にSecretとして登録しておけば、デプロイ後に自動でWorkerへ反映されます（`Sync Worker runtime secrets` ステップ）。手元で `wrangler secret put` を打つ必要はありません。

| 名前 | 必須 | 内容 |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | **必須** | セッション署名用の鍵。`openssl rand -base64 32` の出力など。**未設定だとログイン・サインアップが全て失敗します。**一度決めたら変更しないでください（変更すると全ユーザーのログインが切れます） |
| `STRIPE_SECRET_KEY` | 任意 | 決済を使う場合。未設定でもアプリは起動します |
| `STRIPE_WEBHOOK_SECRET` | 任意 | 手順6で取得する署名シークレット |
| `RESEND_API_KEY` | 任意 | パスワード再設定メール等に使用。未設定の場合は送信されずログ出力のみ |
| `RESEND_FROM_EMAIL` | 任意 | 例: `no-reply@your-domain.com`（Resend側でドメイン認証が必要） |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | 任意 | Googleログインを使う場合 |

登録していないものは**同期時にスキップされるだけ**で、既存の値が消えることはありません。そのため「まずは認証だけ設定して起動 → 後からStripeを追加」という進め方ができます。値がログに出力されることはなく、同期されたシークレット名のみが表示されます。

※ Workerのシークレットは暗号化保存され、書き込み専用です。アプリ側のどのAPIからも読み出せないため、管理画面が万一侵害されてもStripeキーは漏れません。この理由から、これらは意図的にD1（アプリのDB）や設定画面には保存していません。

### 方法B: 手動デプロイ

```bash
npm run deploy
```

いずれの方法でも、初回デプロイ後に表示されるURLにアクセスできれば成功です。

## 6. Stripe Webhookの登録

Stripeダッシュボード → 開発者 → Webhook で、デプロイ後のURL宛にエンドポイントを追加します。

```
https://<your-domain>/api/webhooks/stripe
```

送信するイベント：`checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

発行された署名シークレットを `STRIPE_WEBHOOK_SECRET` として登録し直してください。

## 7. 初回セットアップ（アプリ側）

1. デプロイ先のURLで `/signup` から最初のアカウントを作成してください。**最初に登録したアカウントが自動的に管理者になります**（2人目以降は一般会員です）。
2. `/admin` にログインし、ダッシュボードの「セットアップガイド」に従って以下を設定します。
   - サイト名・ロゴ・アクセントカラー（`/admin/settings`）
   - 特定商取引法に基づく表記（事業者情報）
   - 利用規約・プライバシーポリシー（デフォルトの雛形が入っています。事業内容に応じて必ず見直してください）
   - 会員プラン（`/admin/plans`）
   - 講座（`/admin/courses`）

## 補足：Cloudflareへの自動デプロイについて

稼働中のアプリ自身が「設定画面のボタン一つで自分自身を再デプロイする」ことはプラットフォームの制約上できません（デプロイはビルド＋Wrangler CLIによる別プロセスのため）。そのため上記の「方法A: GitHub Actions」が、pushだけで完結する実質的な最短ルートです。
