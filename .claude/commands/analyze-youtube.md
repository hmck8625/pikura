# YouTube Analytics 分析

YouTubeチャンネルのパフォーマンスを分析してください。

## 手順

1. レポート生成: `node scripts/youtube-report.mjs`（直近28日間）
   - 期間指定: `node scripts/youtube-report.mjs --days 7`（直近7日間）
2. 出力されたMarkdownレポートを読み込み、以下を分析:
   - 動画別の再生数・視聴時間ランキング
   - 最も効果的なコンテンツタイプ（ショート vs 解説 etc.）
   - トラフィックソースの分析（検索 vs 関連動画 vs 外部 etc.）
   - 登録者の増減トレンド
3. 改善提案を出す:
   - 次に作るべき動画のテーマ
   - タイトル・サムネイルの改善案
   - 投稿頻度・タイミングの最適化
   - pikura.appとの連携強化案

## 初回認証（トークンがない場合）
```
node scripts/analytics-auth.mjs
```

## 注意
- YouTube Analytics APIのデータは1-2日遅れで反映されます
- レポートは `reports/youtube-report-{date}.md` に保存されます
