# アイキャッチ画像生成

pikura.app の記事用アイキャッチ（サムネイル）画像を Gemini 画像生成APIで作成します。

## 手順

1. 新記事の場合: `scripts/generate-eyecatch.mjs` の `ARTICLE_PROMPTS` にプロンプトを追加
2. スクリプトを実行して画像生成
3. 生成された画像を `public/images/articles/{slug}.png` に確認

## 実行コマンド

```bash
# 未生成の画像のみ一括生成（推奨）
source .env.local && GEMINI_API_KEY=$GEMINI_API_KEY node scripts/generate-eyecatch.mjs --missing --yes

# 1記事分
source .env.local && GEMINI_API_KEY=$GEMINI_API_KEY node scripts/generate-eyecatch.mjs {slug}

# 全記事分（確認付き）
source .env.local && GEMINI_API_KEY=$GEMINI_API_KEY node scripts/generate-eyecatch.mjs --all
```

## フラグ

| フラグ | 説明 |
|--------|------|
| `--all` | 全スラッグの画像を生成（既存含む） |
| `--missing` | 画像ファイルが存在しないスラッグのみ生成 |
| `--yes` | 確認プロンプトをスキップ |

## 新記事のプロンプト追加

`scripts/generate-eyecatch.mjs` の `ARTICLE_PROMPTS` オブジェクトに追加:

```javascript
"new-article-slug":
  "Description of the image in English. Style keywords. Color palette if needed.",
```

**プロンプトのコツ:**
- 英語で記述する
- スタイル（illustration, infographic, photograph など）を指定
- ブランドカラー: sky blue #0EA5E9, emerald green #10B981, amber #F59E0B
- `No text or watermarks` と `16:9 aspect ratio` は自動付加される

## コスト

- Gemini 画像生成: **¥3-6/枚**（$0.02-0.04）
- 月間上限目安: 50枚以内（¥500以下）

## 注意

- 不要な大量生成はしない。`--missing` フラグで必要分のみ生成するのが推奨
- `/import-articles` 実行後に `--missing --yes` で未生成分を自動補完するのがベストプラクティス
