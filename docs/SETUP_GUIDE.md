# はじめてのセットアップガイド（画面操作だけで公開する）

このガイドのとおりに進めると、会員サイトが `https://greed-learning.<あなたのサブドメイン>.workers.dev` で公開されます。パソコンでコマンドを打つ必要はありません（手順5の合言葉づくりだけ、ターミナルを1回使います）。

> Cloudflare や GitHub の画面は時々デザインが変わります。ボタン名が少し違う場合は、近い名前のものを探してください。

**所要時間：30〜45分**

---

## 全体の流れ

1. Cloudflare：workers.dev のサブドメインを確認する
2. Cloudflare：アカウントIDを控える
3. Cloudflare：データベース（D1）を確認する
4. Cloudflare：APIトークンを作る
5. 合言葉（`BETTER_AUTH_SECRET`）を作る
6. Cloudflare：Turnstile（ボット対策）のキーを作る
7. GitHub：Secrets と Variables を登録する
8. GitHub：PRをマージしてデプロイする
9. サイト：管理者アカウントを作り、招待パスコードを設定する

途中で出てくる値は、**メモ帳などに一時的に貼っておく**と楽です。すべて登録し終えたら、メモは削除してください（特にトークンとシークレットキーは他人に見せないこと）。

| 控える値 | どこで手に入る | 秘密？ |
| --- | --- | --- |
| サブドメイン | 手順1 | 公開してOK |
| アカウントID | 手順2 | あまり見せない |
| APIトークン | 手順4 | **絶対に秘密** |
| BETTER_AUTH_SECRET | 手順5 | **絶対に秘密** |
| Turnstile サイトキー | 手順6 | 公開してOK |
| Turnstile シークレットキー | 手順6 | **絶対に秘密** |

---

## 1. workers.dev のサブドメインを確認する

1. https://dash.cloudflare.com にログインします。
2. 左のメニューから **「Workers & Pages」**（「コンピューティング（Workers）」と表示される場合もあります）を開きます。
3. 画面右側に **「Subdomain（サブドメイン）」** として `xxxx.workers.dev` が表示されます。この `xxxx` を控えます。
   - 初めて開いた場合はサブドメインの作成を求められるので、好きな名前で作成してください。

→ サイトのURLは **`https://greed-learning.xxxx.workers.dev`** になります（`xxxx` を置き換え）。これも控えておきます。

## 2. アカウントIDを控える

1. 同じ **「Workers & Pages」** の画面右側に **「Account ID（アカウントID）」** があります。
2. 右のコピーボタンでコピーして控えます（32文字の英数字）。

> 見つからない場合：ブラウザのアドレスバーの `https://dash.cloudflare.com/` の直後にある32文字の英数字がアカウントIDです。

## 3. データベース（D1）を確認する

1. 左メニューの **「ストレージとデータベース（Storage & Databases）」→「D1 SQL Database」** を開きます。
2. 一覧に **`greed-learning-db`** があるか確認します。
   - **ある場合**：クリックして **Database ID** を確認し、リポジトリの `wrangler.toml` にある `database_id` と同じか見比べます。
     - 同じ → OK、次へ。
     - 違う → GitHub で `wrangler.toml` を開き、鉛筆アイコン（Edit）から `database_id = "..."` をコンソールのIDに書き換えてコミットしてください（分からなければ、IDを教えてもらえればこちらで直します）。
   - **ない場合**：**「データベースを作成（Create Database）」** を押し、名前に `greed-learning-db` と入力して作成します。作成後に表示される Database ID で、上と同じように `wrangler.toml` を書き換えます。

> ここがずれていると、デプロイは「成功」してもサイトが空のデータベースを見てしまいます。デプロイ時にも自動でチェックしていて、ずれていればエラーで止まり、正しいIDを表示します。

## 4. APIトークンを作る

GitHub から Cloudflare へデプロイするための「鍵」です。**前回のデプロイは、このトークンが無効になっていて失敗していました。** 新しく作り直します。

1. Cloudflare の右上の **人型アイコン → 「プロフィール（My Profile）」** を開きます。
2. 左の **「API トークン（API Tokens）」** を開きます。
3. **「トークンを作成する（Create Token）」** を押します。
4. テンプレート一覧の **「Cloudflare Workers を編集する（Edit Cloudflare Workers）」** の右にある **「テンプレートを使用する（Use template）」** を押します。
5. **権限（Permissions）** の一覧の下にある **「+ さらに追加（+ Add more）」** を押し、次の1行を追加します。
   - `アカウント（Account）` ／ `D1` ／ `編集（Edit）`
6. **アカウント リソース（Account Resources）**：`含む（Include）` ／ **自分のアカウント** を選びます。
7. **ゾーン リソース（Zone Resources）**：`含む（Include）` ／ `すべてのゾーン（All zones）` のままでOKです。
8. 下の **「概要に進む（Continue to summary）」** → **「トークンを作成する（Create Token）」** を押します。
9. 表示されたトークンを **すぐにコピーして控えます**。**この画面を閉じると二度と表示されません。**（閉じてしまったら、もう一度作り直せば大丈夫です）

> 古い（無効な）トークンが一覧に残っていれば、右端の「…」から削除しておくと安全です。

## 5. 合言葉（BETTER_AUTH_SECRET）を作る

ログイン情報を暗号化して守るための、ランダムな長い文字列です。**一度決めたら変えないでください**（変えると全員ログアウトされます）。

- **Mac**：「ターミナル」アプリを開き、次を貼り付けて Enter。表示された文字列を控えます。
  ```
  openssl rand -base64 32
  ```
- **Windows**：「PowerShell」を開き、次を貼り付けて Enter。
  ```
  [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
  ```

どちらも `k3J9...=` のような44文字前後の文字列が出ます。

## 6. Turnstile（ボット対策）のキーを作る

ログイン画面などに出る「人間であることを確認します」のチェックボックスです。

1. Cloudflare の左メニューから **「Turnstile」** を開きます（「アプリケーション セキュリティ」の中にある場合もあります）。
2. **「ウィジェットを追加（Add widget）」** を押します。
3. 次のように入力します。
   - **ウィジェット名（Widget name）**：`greed-learning`（何でもOK）
   - **ホスト名（Hostname）**：手順1のURLから `https://` を除いたもの（例：`greed-learning.xxxx.workers.dev`）を追加します。独自ドメインを使う場合はそれも追加します。
   - **ウィジェット モード（Widget Mode）**：`マネージド（Managed）`
   - 事前クリアランス（Pre-clearance）：`いいえ（No）`
4. **「作成（Create）」** を押すと、**サイトキー（Site Key）** と **シークレットキー（Secret Key）** が表示されます。両方控えます。

## 7. GitHub に Secrets と Variables を登録する

1. GitHub でリポジトリ **yutori-kun01/greed-learning** を開きます。
2. 上のタブの **「Settings」** を開きます（見当たらない場合は「…」の中にあります）。
3. 左メニューの **「Secrets and variables」→「Actions」** を開きます。

### 7-1. Secrets（秘密の値）を登録する

**「Secrets」** タブで **「New repository secret」** を押し、**Name** と **Secret** を入れて **「Add secret」**。これを次の5つぶん繰り返します。

| Name（そのまま入力） | Secret（値） |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | 手順4のAPIトークン（既に同じ名前がある場合は、その行の鉛筆アイコンから値を更新） |
| `CLOUDFLARE_ACCOUNT_ID` | 手順2のアカウントID |
| `BETTER_AUTH_SECRET` | 手順5の文字列 |
| `BOOTSTRAP_ADMIN_EMAIL` | あなた（管理者）のメールアドレス |
| `TURNSTILE_SECRET_KEY` | 手順6のシークレットキー |

### 7-2. Variables（公開してよい値）を登録する

同じ画面の **「Variables」** タブで **「New repository variable」** を押し、**Name** と **Value** を入れて **「Add variable」**。

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | 手順1のURL（例：`https://greed-learning.xxxx.workers.dev`、最後の `/` は付けない） |
| `TURNSTILE_SITE_KEY` | 手順6のサイトキー |

> 登録後に値は見えなくなりますが、正常です（Secrets は書き込み専用）。間違えたら同じ名前で更新すれば上書きされます。

## 8. PRをマージしてデプロイする

1. リポジトリの **「Pull requests」** タブから PR #4 を開きます。
2. 下の **「Merge pull request」→「Confirm merge」** を押します。
3. 上の **「Actions」** タブを開くと **「Deploy to Cloudflare」** が動き出します（5分ほど）。
4. 緑のチェック ✅ になれば公開完了です。

**赤い ✕ になった場合**：その実行をクリック → 赤くなっている手順を開くと、日本語／英語で原因が書かれています。代表的なもの：

| エラーの内容 | 対処 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN is invalid, expired or revoked` | 手順4をやり直し、Secret を更新 |
| `... is not set` | 手順7の登録漏れ（名前のスペルも確認） |
| `wrangler.toml points at database_id ...` | 手順3。表示されたIDに書き換え |
| `Could not list D1 databases` | トークンに D1 の編集権限がない → 手順4の5をやり直し |

直せなければ、そのエラー画面の内容を貼ってもらえれば対応します。修正後は、Actions タブの「Deploy to Cloudflare」→「Run workflow」で再実行できます。

## 9. 管理者アカウントを作り、招待パスコードを設定する

1. ブラウザで **`https://greed-learning.xxxx.workers.dev/signup`** を開きます。
   - 「管理者アカウントの作成です」と表示されます。
2. `BOOTSTRAP_ADMIN_EMAIL` に登録したメールアドレスと、パスワード（8文字以上）で登録します。→ 管理者になります。
3. 左下の **「管理者ダッシュボード」→「サイト設定」** を開き、**「会員登録（招待）」** の **登録用パスコード**（6文字以上）を入力して保存します。
4. 同じ欄に表示される **招待URL** をコピーします。
5. 会員になってほしい人に **招待URL とパスコード** を伝えます（別々の手段で送るとより安全です）。
   - 相手は招待URLを開く → パスコードを入力 → 名前・メール・パスワードを登録 → 会員サイトに入れます。
   - パスコードを空にして保存すると、新規登録を止められます。変更すると古いパスコードは使えなくなります。

### コンテンツを入れる

- **講座**：管理者ダッシュボード →「講座管理」→「新規作成」。ステータスを **PUBLISHED（公開）** にすると会員に見えます。
- **レッスン**：講座の「編集」→「新規レッスン追加」。動画は YouTube（限定公開がおすすめ）や Vimeo のURLを貼ります。
- **記事**：「記事管理」から作成できます（有料記事は決済設定が必要なので、今は「全体公開」か「会員限定」を使ってください）。

---

## あとから追加できるもの（今は不要）

| 機能 | 必要なもの |
| --- | --- |
| パスワード再設定メール・お問い合わせメール | 管理画面「サイト設定 → メール送信（Resend）」で、ResendのAPIキーと送信元アドレスを入力して保存 →「自分宛てにテストメールを送る」で確認。**パスワードを忘れたときの復旧に必要なので、早めの設定がおすすめ** |
| 画像・ファイルのアップロード | R2 のAPIキー（`R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`）と公開URL（`R2_PUBLIC_URL`）。詳細は DEPLOY.md |
| 決済（会員プラン販売・有料記事） | Stripe のキー。詳細は DEPLOY.md |
