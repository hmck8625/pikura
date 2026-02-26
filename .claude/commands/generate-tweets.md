# ツイート候補生成

pikura.app の X（Twitter）アカウント @pikura_app 用のツイート候補を5カテゴリ分生成します。

## 手順

1. `scripts/generate-tweets.mjs` を実行する
2. 環境変数 `GEMINI_API_KEY` を `.env.local` から読み取る
3. 生成された5つのツイート候補をユーザーに表示する
4. API使用量（無料枠）を表示する

## 実行コマンド

```bash
source .env.local && GEMINI_API_KEY=$GEMINI_API_KEY node scripts/generate-tweets.mjs
```

## カテゴリ

1. ランキング紹介（選手スポットライト）
2. ルール豆知識（「知ってた？」フック）
3. 記事紹介（pikura.app記事への導線）
4. コミュニティ（エンゲージメント促進）
5. 大会情報（参加促進）

## コスト

- Gemini 2.5 Flash テキスト生成: **無料枠**（1リクエスト/回）

## 更新タイミング

- トップ選手データ（`TOP_PLAYERS`）: ランキング更新時に `scripts/generate-tweets.mjs` を編集
- 記事リスト（`ARTICLES`）: 新記事追加時に `scripts/generate-tweets.mjs` を編集
