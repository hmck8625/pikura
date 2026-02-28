# microCMS 記事一括入稿

Markdown形式の記事をmicroCMSに一括入稿し、アイキャッチ画像も生成します。

## 手順

1. `/articles/` ディレクトリ（プロジェクトルートの親）に記事Markdownファイルを配置
2. `scripts/import-articles.mjs` の `articles` 配列に新記事のメタデータを追加
3. `scripts/generate-eyecatch.mjs` の `ARTICLE_PROMPTS` に新記事の画像プロンプトを追加
4. スクリプトを実行して入稿
5. カテゴリ警告が出た場合は対処する
6. アイキャッチ画像を生成する

## 実行コマンド

```bash
# 全記事入稿（新規＋更新）
source .env.local && MICROCMS_WRITE_KEY=$MICROCMS_API_KEY node scripts/import-articles.mjs

# 特定記事のみ
source .env.local && MICROCMS_WRITE_KEY=$MICROCMS_API_KEY node scripts/import-articles.mjs --slug {slug}

# 既存記事を更新
source .env.local && MICROCMS_WRITE_KEY=$MICROCMS_API_KEY node scripts/import-articles.mjs --update
```

## 入稿後: アイキャッチ画像の生成

```bash
# 未生成の画像のみ自動生成（確認なし）
source .env.local && GEMINI_API_KEY=$GEMINI_API_KEY node scripts/generate-eyecatch.mjs --missing --yes
```

**重要:** 新記事追加時は `generate-eyecatch.mjs` の `ARTICLE_PROMPTS` にプロンプトを追加してから実行すること。

## 入稿後: カテゴリの確認

スクリプト実行後に `⚠️ カテゴリ警告` が表示された場合：

1. microCMSダッシュボード（https://pikura.microcms.io）でスキーマを確認
2. `category` フィールドのセレクト選択肢に該当カテゴリ値が登録されているか確認
3. 未登録なら追加して保存
4. 修正スクリプトを実行:

```bash
source .env.local && MICROCMS_WRITE_KEY=$MICROCMS_API_KEY node scripts/fix-beginner-category.mjs
```

**既知の問題:** microCMSは未登録のカテゴリ値を**エラーなしで無視**する（空配列になる）。

## 記事Markdownファイルの命名規則

`{番号}_{日本語タイトル}.md`（例: `011_大阪でできる場所.md`）

## 記事メタデータ（scripts/import-articles.mjs に追加）

```javascript
{
  slug: "osaka-pickleball-courts",
  title: "大阪でピックルボールができる場所まとめ",
  category: "beginner",  // beginner, rules, gear, events, tips, players
  description: "大阪府内のピックルボール施設をまとめました。",
  file: "011_大阪でできる場所.md",
}
```

## 入稿後の確認

- microCMS管理画面: https://pikura.microcms.io
- 記事が「下書き」状態で入稿される → 管理画面で「公開」する

## コスト

- microCMS入稿: 無料
- アイキャッチ画像生成: **¥3-6/枚**（Gemini API）
