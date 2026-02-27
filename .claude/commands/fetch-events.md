# /fetch-events — JPA イベントデータ更新

JPA（日本ピックルボール協会）の WordPress REST API からイベント・大会情報を取得し、
`src/lib/events/data.ts` を更新するスキル。

## 実行手順

1. 以下のコマンドを実行:
   ```
   node scripts/fetch-jpa-events.mjs
   ```

2. 実行結果を確認:
   - 取得件数
   - 日付抽出率
   - 場所抽出率
   - カテゴリ分布

3. `src/lib/events/data.ts` が正しく更新されたことを確認

4. ビルドチェック:
   ```
   npm run build
   ```

5. 問題なければコミット:
   ```
   git add src/lib/events/data.ts
   git commit -m "chore: update JPA event data ($(date +%Y-%m-%d))"
   ```

## 運用

- **頻度**: 週1回（月曜日推奨）
- **コスト**: 無料（WordPress REST API）
- **所要時間**: 約30秒
- **データソース**: https://japanpickleball.org/wp-json/wp/v2/posts
- **対象カテゴリ**: 大会（主催/JPA TOURS/公認/国際/その他）、イベント（協会主催/体験会/資格講習会/JPAイベント）

## 注意事項

- data.ts は自動生成ファイルのため、手動編集しないこと
- JPA サイトがメンテナンス中の場合は翌日再実行
- 新しいカテゴリが追加された場合は `scripts/fetch-jpa-events.mjs` の `CATEGORY_MAP` を更新
