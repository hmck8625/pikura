# ショート動画台本生成

pikura.app の YouTube Shorts / TikTok 用の30秒ショート動画台本を Gemini APIで生成します。

## 手順

1. ユーザーにテーマを確認する（未指定ならメニューから選択）
2. `scripts/generate-video-script.mjs` を実行する
3. 生成された台本を表示する
4. 必要に応じて制作メモのAI画像リストを `generate-eyecatch` で生成

## 実行コマンド

```bash
# テーマ指定
source .env.local && GEMINI_API_KEY=$GEMINI_API_KEY node scripts/generate-video-script.mjs "テーマ名"

# インタラクティブメニュー
source .env.local && GEMINI_API_KEY=$GEMINI_API_KEY node scripts/generate-video-script.mjs
```

## プリセットテーマ

1. キッチンルール解説
2. サーブの打ち方
3. ダブルスのポジショニング
4. パドルの選び方30秒
5. ピックルボール vs テニス
6. スコアの数え方
7. ディンクショットの基本
8. 大会に初参加する方法

## 制作フロー

### 自動パイプライン（推奨）
台本生成 → フレーム画像生成 → Google Cloud TTS → FFmpeg動画組み立て → MP4出力

`/generate-short` スキル（`scripts/article-to-short.mjs`）で一括自動化可能。

### 手動パイプライン（カスタム編集が必要な場合）
台本生成（本スクリプト） → 画像生成（generate-short-frames.mjs） → 動画組み立て（generate-short-video.mjs）

## コスト

- 台本生成: **無料枠**（1リクエスト/回）
- 自動パイプラインで動画1本: 約¥27-54（フレーム画像9枚分）
