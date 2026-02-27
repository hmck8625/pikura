# /add-event — 手動イベント追加

テニスベア・PJF・その他の公開情報からピックルボールイベントを手動で追加するワークフロー。

## 実行手順

1. ユーザーからイベント情報を受け取る（URL、タイトル、日時、場所など）

2. `scripts/manual-events.json` を開き、以下の形式でイベントを追加:
   ```json
   {
     "id": "tennisbear-xxx",
     "title": "○○クラブ ピックルボール交流会",
     "description": "イベントの説明",
     "eventDate": "2026-03-15",
     "eventEndDate": null,
     "prefecture": "東京都",
     "location": "○○テニスクラブ",
     "category": "experience",
     "level": "beginner",
     "source": "tennisbear",
     "sourceUrl": "https://tennisbear.net/pickleball/event/xxx",
     "sourceEventId": "xxx",
     "entryFee": "¥2,000",
     "format": ["doubles", "mixed"],
     "duprReflected": false,
     "registrationStatus": "open",
     "registrationUrl": "https://tennisbear.net/pickleball/event/xxx/entry",
     "maxParticipants": 32,
     "currentParticipants": null,
     "latitude": null,
     "longitude": null,
     "publishedAt": "2026-03-01T00:00:00"
   }
   ```

3. ID命名規則:
   - テニスベア: `tennisbear-{元ID or 連番}`
   - PJF: `pjf-{元ID or 連番}`
   - その他: `manual-{連番}`

4. データを統合して再生成:
   ```
   node scripts/fetch-all-events.mjs
   ```

5. ビルドチェック:
   ```
   npm run build
   ```

6. 問題なければコミット:
   ```
   git add scripts/manual-events.json src/lib/events/data.ts
   git commit -m "feat: add manual event - [イベント名]"
   ```

## フィールド説明

| フィールド | 必須 | 説明 |
|-----------|------|------|
| id | ○ | `{source}-{id}` 形式 |
| title | ○ | イベント名 |
| eventDate | ○ | "YYYY-MM-DD" |
| prefecture | ○ | 47都道府県のいずれか |
| source | ○ | "tennisbear" / "pjf" / "manual" |
| sourceUrl | ○ | 元ページのURL |
| category | ○ | "tournament" / "experience" / "workshop" / "certification" / "other" |
| level | - | "beginner" / "intermediate" / "advanced" / "open" / "unknown" |
| duprReflected | - | true / false / null |
| entryFee | - | "¥3,000" / "無料" / null |
| format | - | ["singles", "doubles", "mixed"] |

## 注意

- 公開情報のみ収集すること（API解析・スクレイピングは禁止）
- 重複登録に注意（sourceUrl で重複排除される）
- データ再生成時にJPA APIへのアクセスも行われるため、ネットワーク接続が必要
