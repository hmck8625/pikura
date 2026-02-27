# /update-sitemap — サイトマップ確認・更新

サイトマップ（`src/app/sitemap.ts`）に全ページが正しく含まれているか確認し、
必要に応じて更新するスキル。

## 確認手順

1. 現在のサイトマップ内容を確認:
   ```
   cat src/app/sitemap.ts
   ```

2. ビルドしてsitemap.xmlを生成:
   ```
   npm run build
   ```

3. 生成されたsitemap.xmlのURL数を確認:
   ```
   grep -c '<url>' .next/server/app/sitemap.xml/body
   ```

4. 以下が含まれていることを確認:
   - トップページ（/）
   - 記事一覧（/articles）
   - ランキング一覧（/rankings）
   - イベント一覧（/events）
   - ペア募集（/pairs）
   - 全記事の個別ページ（/articles/{slug}） — microCMS API経由
   - 全選手の個別ページ（/players/{slug}） — 124名分
   - 全イベントの個別ページ（/events/{id}） — 229件分
   - 利用規約（/terms）、プライバシーポリシー（/privacy）

5. 新しいページが追加された場合は `src/app/sitemap.ts` を更新

6. Google Search Consoleでサイトマップの再送信:
   - https://search.google.com/search-console
   - サイトマップ → `https://pikura.app/sitemap.xml` を送信

## データソース

| セクション | ソース | 動的 |
|-----------|--------|------|
| 記事 | microCMS API (`getAllArticleSlugs`) | Yes |
| 選手 | `lib/ranking/data.ts` (`getAllPlayerSlugs`) | No |
| イベント | `lib/events/data.ts` (`getAllEventIds`) | No |
| 静的ページ | ハードコード | No |

## 運用

- **頻度**: 新しいページを追加した時、週次レビュー時
- **注意**: microCMSの記事はISRで取得されるため、新記事追加後は自動反映される
