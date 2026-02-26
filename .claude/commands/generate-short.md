# ショート動画生成

記事の内容をYouTube Shorts用のショート動画（30-50秒、9:16縦型）に変換します。

## パイプライン

1. **台本生成**（Gemini テキストAPI / 無料）: 記事内容から8-9シーンのストーリーボードを自動生成
2. **フレーム画像生成**（Gemini Image API / ¥27-54）: 各シーンのイラストを生成（テキストなし、統一スタイル）
3. **ナレーション音声生成**（Google Cloud TTS / 無料）: 日本語ナレーションを自動生成、ffprobeで実尺を測定
4. **動画組み立て**（FFmpeg / 無料）: 画像+テロップ+音声→MP4

## 使い方

### 記事スラッグを指定（推奨）

```bash
GEMINI_API_KEY=xxx node scripts/article-to-short.mjs pickleball-rules
```

### カスタムトピックを指定

```bash
GEMINI_API_KEY=xxx node scripts/article-to-short.mjs --topic "ピックルボールの始め方"
```

### 既存のkitchen-rulesを再生成（個別スクリプト）

```bash
# フレーム画像のみ再生成
GEMINI_API_KEY=xxx node scripts/generate-short-frames.mjs kitchen-rules

# 動画のみ再生成（既存画像を使用）
GEMINI_API_KEY=xxx node scripts/generate-short-video.mjs
```

## 対応記事スラッグ

- `what-is-pickleball` — ピックルボールとは
- `how-to-start-pickleball` — 始め方
- `pickleball-rules` — ルール解説
- `paddle-guide` — パドルガイド
- `tokyo-pickleball-courts` — 東京コート
- `doubles-tactics` — ダブルス戦術
- `court-size-setup` — コートサイズ
- `shoes-guide` — シューズガイド
- `first-tournament-guide` — 大会参加ガイド
- `jpa-ranking-explained` — JPAランキング

## コスト

| 項目 | 費用 |
|------|------|
| 台本生成 | ¥0（テキストAPI無料枠） |
| フレーム画像（9枚） | ¥27-54 |
| TTS音声 | ¥0（月100万文字無料） |
| FFmpeg | ¥0 |
| **合計** | **¥27-54** |

## 出力

- 画像: `public/images/shorts/{slug}/`
- 動画: `public/videos/{slug}.mp4`
- 台本: `public/images/shorts/{slug}/storyboard.json`

## 品質チェックリスト

- [ ] 画像にテキストが含まれていないか（Geminiの既知制限）
- [ ] テロップが読みやすいか
- [ ] ナレーションの速度が自然か
- [ ] 動画尺が30-60秒に収まっているか
- [ ] エンドカードが適切か（pikura.appのみ）
