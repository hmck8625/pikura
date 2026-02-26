# アイキャッチ画像生成

pikura.app の記事用アイキャッチ（サムネイル）画像を Gemini 画像生成APIで作成します。

## 手順

1. ユーザーに対象記事のslugを確認する（または `--all` で全記事）
2. `scripts/generate-eyecatch.mjs` を実行する
3. 生成された画像を `public/images/articles/{slug}.png` に保存
4. コスト表示を確認する

## 実行コマンド

```bash
# 1記事分
source .env.local && GEMINI_API_KEY=$GEMINI_API_KEY node scripts/generate-eyecatch.mjs {slug}

# 全記事分（確認付き）
source .env.local && echo "y" | GEMINI_API_KEY=$GEMINI_API_KEY node scripts/generate-eyecatch.mjs --all
```

## 対応slug一覧

- what-is-pickleball, how-to-start-pickleball, pickleball-rules
- paddle-guide, tokyo-pickleball-courts, doubles-tactics
- court-size-setup, shoes-guide, first-tournament-guide, jpa-ranking-explained

## コスト

- Gemini 画像生成: **¥3-6/枚**（$0.02-0.04）
- 全10記事: 約¥30-60
- 月間上限: 50枚以内（¥500以下）

## 注意

- 不要な大量生成はしない。必要な分だけオンデマンドで生成
- 生成前に必ずコスト表示と確認プロンプトが出る
