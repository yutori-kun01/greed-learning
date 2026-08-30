# greed-learning — 会員制ラーニングサイト

Next.js + Cloudflare Workers（D1 / R2）で構築した、サブスク課金対応の会員制学習プラットフォームです。ダークネイビー × ゴールドを基調としたUIで、講座・記事の配信、会員管理、決済までを一通り備えています。

自分自身でこのサイトを運用することも、事業者向けにこのシステム自体をテンプレートとして配布することも想定した構成になっています（利用者ごとに自分のCloudflareアカウントへ1つデプロイする形）。

## 主な機能

- **会員機能**: メール/パスワード・Googleログイン、講座の閲覧・進捗管理、ブックマーク、ダーク/ライトモード
- **決済**: Stripeによるサブスクリプション課金（プラン管理）、記事単位の買い切り課金
- **アクセス制御**: プラン単位・enrollment単位で講座やリソースの公開範囲を制御
- **管理画面**: 講座・記事（TipTapエディタ）・ユーザー・プラン・サイト設定の管理
- **法的ページ**: 特定商取引法に基づく表記・利用規約・プライバシーポリシーをデフォルトテンプレート付きで同梱、管理画面から編集可能
- **セットアップガイド**: 管理者ダッシュボードで未設定項目を可視化
- **初回管理者の自動割り当て**: 最初にサインアップしたアカウントが自動的に管理者になります

## 技術スタック

- Next.js 16 / React 19 / Tailwind v4
- Drizzle ORM + Cloudflare D1（SQLite）
- Better Auth（認証）
- Stripe（決済）
- Cloudflare Workers + R2（デプロイ・ストレージ、`@opennextjs/cloudflare`でビルド）
- Vitest（テスト）

## ローカル開発

```bash
npm install
cp .env.example .env   # 値を埋める
npm run dev
```

`.env` に `ENABLE_DEV_BYPASS=true` を設定すると、ログインなしで管理者として動作確認できます（開発環境限定）。

## テスト・ビルド

```bash
npm run test        # vitest
npm run lint         # eslint
npm run build        # next build
npm run build:worker # opennextjs-cloudflare build
```

## 本番デプロイ

自分のCloudflareアカウントへデプロイする手順は [DEPLOY.md](./DEPLOY.md) を参照してください。
