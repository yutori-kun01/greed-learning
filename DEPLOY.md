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

`wrangler d1 create` の出力に表示される `database_id` を、`wrangler.toml` の該当箇所に書き換えてください。

```toml
[[d1_databases]]
binding = "DB"
database_name = "greed-learning-db"
database_id = "ここに出力されたIDを貼る"
migrations_dir = "./src/db/migrations"

[[r2_buckets]]
binding = "R2_ASSETS"
bucket_name = "greed-learning-assets"
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
| `NEXT_PUBLIC_APP_URL` | 本番URL（例: `https://your-domain.workers.dev`） |

登録後、`main`（デフォルトブランチ）にpushすると Actions タブでビルド〜デプロイの進行状況を確認できます。手動で今すぐ実行したい場合は Actions タブから `Deploy to Cloudflare` ワークフローを選び「Run workflow」でも起動できます。

※ このGitHub Actionsのトークンは**デプロイ専用**です。Stripe/Resendなどアプリ実行時に使うシークレットは、次のステップの通り引き続き `wrangler secret put` で別途登録してください（GitHub Secretsとは別物です）。

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
