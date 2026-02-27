# /fetch-events — イベントデータ統合更新

JPA WordPress REST API + 手動キュレーションデータを統合し、
`src/lib/events/data.ts` を更新するスキル。

## 実行手順

1. 以下のコマンドを実行:
   ```
   node scripts/fetch-all-events.mjs
   ```

2. 実行結果を確認:
   - 取得件数（JPA + 手動）
   - 日付抽出率
   - 場所抽出率
   - 参加費抽出率
   - レベル抽出率
   - ソース分布
   - カテゴリ分布

3. `src/lib/events/data.ts` が正しく更新されたことを確認

4. ビルドチェック:
   ```
   npm run build
   ```

5. 問題なければコミット:
   ```
   git add src/lib/events/data.ts
   git commit -m "chore: update event data ($(date +%Y-%m-%d))"
   ```

## 運用

- **頻度**: 週1回（月曜日推奨）
- **コスト**: 無料（WordPress REST API + ローカルJSON）
- **所要時間**: 約30秒
- **データソース**:
  - JPA: https://japanpickleball.org/wp-json/wp/v2/posts（自動取得）
  - テニスベア・PJF・その他: `scripts/manual-events.json`（手動キュレーション）
- **対象カテゴリ**: 大会、体験会・交流会、イベント、資格講習会

## 注意事項

- data.ts は自動生成ファイルのため、手動編集しないこと
- 手動イベントは `scripts/manual-events.json` で管理（`/add-event` スキルで追加）
- JPA サイトがメンテナンス中の場合は翌日再実行
- 新しいカテゴリが追加された場合は `scripts/fetch-all-events.mjs` の `CATEGORY_MAP` を更新
