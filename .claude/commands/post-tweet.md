# ツイート生成→投稿

Gemini APIでツイート候補を5つ生成し、選択して @pikura_app に投稿します。

## 手順

1. `.env.local` から環境変数を読み込む
2. `scripts/auto-tweet.mjs` を実行する
3. 5つのツイート候補が生成される
4. ユーザーに候補を見せて投稿するか確認する

## 実行コマンド

### 対話モード（候補から選んで投稿）
```bash
cd pikura && source .env.local && node scripts/auto-tweet.mjs
```

### 自動モード（ランダムに1つ選んで投稿）
```bash
cd pikura && source .env.local && node scripts/auto-tweet.mjs --auto
```

### 確認のみ（投稿しない）
```bash
cd pikura && source .env.local && node scripts/auto-tweet.mjs --dry-run
```

### 手動で任意のテキストを投稿
```bash
cd pikura && source .env.local && node scripts/post-tweet.mjs "ツイート本文"
```

## 前提条件

- `GEMINI_API_KEY` — ツイート候補生成用
- `X_CONSUMER_KEY`, `X_CONSUMER_SECRET` — X API認証
- `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET` — X API認証（Developer Portal で Generate）

## コスト

- Gemini 2.5 Flash テキスト生成: **無料枠**（1リクエスト/回）
- X API: **無料**（Basic プラン: 月1,500ツイートまで）

## 投稿履歴

投稿したツイートは `scripts/.tweet-history.json` に自動記録されます（重複防止用）。
