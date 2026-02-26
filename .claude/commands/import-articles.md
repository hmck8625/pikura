# microCMS 記事一括入稿

Markdown形式の記事をmicroCMSに一括入稿します。

## 手順

1. `/articles/` ディレクトリ（プロジェクトルートの親）に記事Markdownファイルを配置
2. `scripts/import-articles.mjs` の `articles` 配列に新記事のメタデータを追加
3. スクリプトを実行して入稿

## 実行コマンド

```bash
source .env.local && MICROCMS_WRITE_KEY=$MICROCMS_API_KEY node scripts/import-articles.mjs
```

## 記事Markdownファイルの命名規則

`{番号}_{日本語タイトル}.md`（例: `011_大阪でできる場所.md`）

## 記事メタデータ（scripts/import-articles.mjs に追加）

```javascript
{
  slug: "osaka-pickleball-courts",
  title: "大阪でピックルボールができる場所まとめ",
  category: "beginner",  // beginner, rules, gear, events, tips
  description: "大阪府内のピックルボール施設をまとめました。",
  file: "011_大阪でできる場所.md",
}
```

## 入稿後の確認

- microCMS管理画面: https://pikura.microcms.io
- 記事が「下書き」状態で入稿される → 管理画面で「公開」する

## コスト

- 無料（microCMS APIコスト不要）
