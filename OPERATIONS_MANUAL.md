# pikura.app 運用マニュアル

> 最終更新: 2026-02-27

このマニュアルは、pikura.appの運用・保守を行う人間またはAIエージェント向けの操作ガイドです。
技術仕様は `CLAUDE.md` を参照してください。このマニュアルでは「何をどうやるか」に焦点を当てます。

---

## 目次

1. [環境構築](#1-環境構築)
2. [日常運用フロー](#2-日常運用フロー)
3. [記事管理](#3-記事管理)
4. [イベント管理](#4-イベント管理)
5. [ショップ / 商品管理](#5-ショップ--商品管理)
6. [ショート動画](#6-ショート動画)
7. [SNS運用](#7-sns運用)
8. [デプロイ](#8-デプロイ)
9. [スキル一覧](#9-スキル一覧)
10. [トラブルシューティング](#10-トラブルシューティング)

---

## 1. 環境構築

### 必須ソフトウェア

| ツール | 用途 | インストール |
|--------|------|-------------|
| Node.js 20+ | スクリプト実行 | `nvm install 20` |
| npm | パッケージ管理 | Node.jsに同梱 |
| Git | バージョン管理 | `sudo apt install git` |
| FFmpeg | 動画生成 | `sudo apt install ffmpeg` |

### 初回セットアップ

```bash
cd pikura
npm install
```

### 環境変数（`.env.local`）

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# microCMS
MICROCMS_API_KEY=xxx            # Read + Write兼用

# Amazon アソシエイト
NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG=pokeraiii-22

# Gemini API（画像・テキスト生成）
GEMINI_API_KEY=xxx

# BASE EC（ショップ連携）
BASE_CLIENT_ID=xxx
BASE_CLIENT_SECRET=xxx

# Google Cloud TTS（ショート動画ナレーション用。省略可）
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

> **注意**: `.env.local` と `.base-tokens.json` は `.gitignore` に入っている。リポジトリには含まれない。

---

## 2. 日常運用フロー

### 週次ルーティン

1. **イベント更新**（週1回）
   ```bash
   node scripts/fetch-all-events.mjs
   ```
   → JPA公式API + 手動登録分をマージして `src/lib/events/data.ts` を再生成

2. **手動イベント追加**（テニスベア・PJF等で新規発見時）
   → `/add-event` スキルを使用、または `scripts/manual-events.json` を直接編集

3. **記事入稿**（記事完成時）
   ```bash
   MICROCMS_WRITE_KEY=xxx node scripts/import-articles.mjs
   ```

4. **ツイート生成**（週2-3回）
   ```bash
   GEMINI_API_KEY=xxx node scripts/generate-tweets.mjs
   ```

5. **週次レビュー**（金曜）
   → `/weekly-review` スキルを使用

### デプロイサイクル

コード変更 → `git push origin main` → Vercel自動デプロイ（約1-2分）

---

## 3. 記事管理

### アーキテクチャ

```
記事Markdown → import-articles.mjs → microCMS API → pikura.app/articles/[slug]
              （HTML変換+入稿）        （ヘッドレスCMS）  （SSG/ISR表示）
```

### 記事の追加手順

1. `../articles/` ディレクトリ（pikuraの親）にMarkdownファイルを作成
   - ファイル名: `{slug}.md`
   - フロントマター: title, description, category, slug

2. アイキャッチ画像を生成（任意）
   ```bash
   GEMINI_API_KEY=xxx node scripts/generate-eyecatch.mjs {slug}
   ```
   → `public/images/articles/{slug}.png` に出力

3. microCMSに入稿
   ```bash
   MICROCMS_WRITE_KEY=xxx node scripts/import-articles.mjs --slug {slug}
   ```

4. 記事を更新する場合
   ```bash
   MICROCMS_WRITE_KEY=xxx node scripts/import-articles.mjs --update --slug {slug}
   ```

### カテゴリ値

`beginner`, `rules`, `gear`, `events`, `tips`, `players`

---

## 4. イベント管理

### データソース

| ソース | 取得方法 | 格納先 |
|--------|---------|--------|
| JPA公式 | WordPress REST API自動取得 | スクリプトが自動処理 |
| テニスベア | 手動キュレーション | `scripts/manual-events.json` |
| PJF | 手動キュレーション | `scripts/manual-events.json` |
| その他 | 手動キュレーション | `scripts/manual-events.json` |

### イベント全件更新

```bash
node scripts/fetch-all-events.mjs
```

処理内容:
1. JPA WordPress API から全投稿を自動取得
2. `scripts/manual-events.json` から手動登録イベントを読み込み
3. マージ・重複排除・日付ソート
4. `src/lib/events/data.ts` に TypeScript データとして書き出し

### 手動イベントの追加

`scripts/manual-events.json` に以下の形式で追加:

```json
{
  "title": "イベント名",
  "eventDate": "2026-04-01",
  "eventEndDate": null,
  "prefecture": "東京都",
  "location": "会場名",
  "category": "tournament",
  "level": "open",
  "source": "tennisbear",
  "sourceUrl": "https://例.com/event/123",
  "entryFee": "¥3,000",
  "format": ["doubles", "mixed"],
  "duprReflected": true,
  "registrationStatus": "open",
  "registrationUrl": "https://例.com/entry/123",
  "description": "補足説明（HTMLタグ内から抽出した場合はプレーンテキストに）"
}
```

追加後、`node scripts/fetch-all-events.mjs` を実行してdata.tsを再生成。

### カテゴリ・レベル値

- **カテゴリ**: `tournament`（大会）, `experience`（体験会・交流会）, `workshop`（イベント）, `certification`（資格講習会）
- **レベル**: `beginner`, `intermediate`, `advanced`, `open`, `unknown`
- **形式**: `singles`, `doubles`, `mixed`, `unknown`
- **ソース**: `jpa`, `tennisbear`, `pjf`, `manual`

---

## 5. ショップ / 商品管理

### アーキテクチャ

```
pikura.app（商品ギャラリー + SEO） → BASE（EC・決済・発送）→ UP-T（印刷・受注生産）
```

- pikura.appは商品の **表示・集客** のみ担当
- 購入・決済・発送は **BASE** が担当（外部サービス）
- 印刷は **UP-T** が担当（BASEと連携）

### 商品データの構成

| ファイル | 役割 |
|----------|------|
| `src/lib/shop/data.ts` | 商品マスターデータ（25商品） |
| `src/lib/shop/types.ts` | Product型定義 |
| `public/images/shop/{slug}.png` | モックアップ画像 |
| `scripts/generate-tshirt-designs.mjs` | 画像生成スクリプト |
| `scripts/base-api.mjs` | BASE API連携スクリプト |
| `scripts/base-item-mapping.json` | slug↔BASE item_id マッピング（自動生成） |

### 新商品を追加する完全手順

> `/add-product` スキルで定義済み。以下はその詳細。

#### Step 1: 3ファイルにデータを追加

**① `src/lib/shop/data.ts`** — PRODUCTS配列に追加:
```typescript
{
  id: "26",  // 連番
  slug: "new-design-slug",
  name: "デザイン名",
  nameEn: "Design Name English",
  description: "商品説明文。ポリエステル100% 吸水速乾ドライ素材。",
  category: "humor",  // humor | stylish | japanese | design | brand
  price: 4000,
  designText: "Tシャツに印刷されるテキスト",
  designConcept: "デザインコンセプトの説明",
  imagePath: "/images/shop/new-design-slug.png",
  purchaseUrl: null,  // Step 5で更新
  tags: ["タグ1", "タグ2"],
  published: true,
}
```

**② `scripts/generate-tshirt-designs.mjs`** — DESIGNS オブジェクトに追加:
```javascript
"new-design-slug": {
  text: "デザインテキスト",
  style: "スタイルの説明（英語推奨）",
},
```

**③ `scripts/base-api.mjs`** — PRODUCTS 配列に追加:
```javascript
{ slug: "new-design-slug", name: "デザイン名", price: 4000, desc: "説明文" },
```

#### Step 2: モックアップ画像を生成

```bash
GEMINI_API_KEY=$GEMINI_API_KEY node scripts/generate-tshirt-designs.mjs new-design-slug
```
→ `public/images/shop/new-design-slug.png` が生成される（約1.2MB）
→ コスト: ¥3-6/枚

#### Step 3: ビルド確認

```bash
npm run build
```
→ `/shop/new-design-slug` が静的生成されることを確認

#### Step 4: デプロイ

```bash
git add public/images/shop/new-design-slug.png src/lib/shop/data.ts scripts/
git commit -m "Add new product: デザイン名"
git push origin main
```
→ Vercel自動デプロイ。画像が `https://pikura.app/images/shop/new-design-slug.png` で公開される。

**重要: BASEへの画像登録には画像の公開URLが必要。必ず先にデプロイすること。**

#### Step 5: BASEに商品登録 + 画像アップロード

```bash
# トークンが有効か確認
node scripts/base-api.mjs status

# トークン期限切れの場合は再認証
node scripts/base-api.mjs auth

# 商品登録
node scripts/base-api.mjs register --slug new-design-slug

# 画像アップロード（デプロイ後のみ可能）
node scripts/base-api.mjs upload-images --slug new-design-slug
```

#### Step 6: 購入URLを設定

BASEに登録すると `scripts/base-item-mapping.json` に item_id が記録される。
`src/lib/shop/data.ts` の該当商品の `purchaseUrl` を更新:

```typescript
purchaseUrl: "https://pikura.official.ec/items/{item_id}",
```

#### Step 7: 再デプロイ

```bash
git add src/lib/shop/data.ts
git commit -m "Update purchaseUrl for new-design-slug"
git push origin main
```

### BASE API 認証について

- OAuth2フロー。アクセストークンの有効期限は **30日**。
- トークンは `.base-tokens.json` にローカル保存される。
- 期限切れ時は `node scripts/base-api.mjs auth` で再認証。
- WSL2環境ではlocalhost問題があるため、**手動コード貼り付け方式** を採用:
  1. スクリプトが認証URLを表示
  2. ブラウザでURLを開いてBASEにログイン・認可
  3. リダイレクト先URL（`localhost:3456/callback?code=xxx`）をターミナルに貼り付け
  4. スクリプトがcodeを抽出してトークンを取得

### BASE API の注意点

- 画像アップロードは **ファイル直接送信ではない**。`image_url` パラメータに公開URLを指定する方式。
- つまり画像はpikura.appにデプロイ済みでなければBASEに登録できない。
- API: `POST /1/items/add_image` — パラメータ: `item_id`, `image_no`, `image_url`

---

## 6. ショート動画

### パイプライン

```
記事slug → 台本生成 → フレーム画像生成 → TTS音声生成 → FFmpeg動画合成 → MP4
          (Gemini無料)  (Gemini有料¥27-54)  (Google TTS無料)  (FFmpeg無料)
```

### 一括生成

```bash
GEMINI_API_KEY=xxx node scripts/article-to-short.mjs {slug}
```

### 個別ステップ

```bash
# 台本のみ生成
GEMINI_API_KEY=xxx node scripts/generate-video-script.mjs {slug}

# フレーム画像のみ生成
GEMINI_API_KEY=xxx node scripts/generate-short-frames.mjs {slug}

# 動画組み立てのみ（要FFmpeg）
node scripts/generate-short-video.mjs {slug}
```

### YouTubeアップロード

```bash
# 初回のみ: OAuth認証（ブラウザが開く → Googleログイン → トークン保存）
node scripts/youtube-auth.mjs

# アップロード（デフォルト: unlisted）
node scripts/youtube-upload.mjs {slug}

# 全動画一括アップロード
node scripts/youtube-upload.mjs --all

# 予約投稿（1本目即公開 + 残りを5時間間隔で予約）
node scripts/youtube-upload.mjs --all --schedule 5h

# dry-run（確認のみ。メタデータと予約時刻を表示）
node scripts/youtube-upload.mjs --all --schedule 5h --dry-run

# 公開設定を指定
node scripts/youtube-upload.mjs {slug} --privacy private
```

- メタデータ: `public/videos/youtube-metadata.md` に定義（タイトル・説明文・タグを自動パース）
- クォータ: 1本 ≈ 1,600 units / 日次上限 10,000 units（最大6本/日）
- 未検証プロジェクトは `public` 設定が制限される。`unlisted` を推奨
- OAuth認証: ウェブアプリ型クライアント。トークンは `.youtube-token.json` にローカル保存（自動リフレッシュ対応）
- リダイレクトURI: `http://127.0.0.1:8080/`（Google Cloud Consoleに登録済み）

---

## 7. SNS運用

### ツイート生成

```bash
GEMINI_API_KEY=xxx node scripts/generate-tweets.mjs
```
→ 5候補を生成。人間がピックして手動投稿。

---

## 8. デプロイ

### Vercelデプロイ（自動）

```bash
git push origin main
```
→ Vercelが自動検知してビルド・デプロイ（1-2分）

### ビルド確認（ローカル）

```bash
npm run build    # 静的生成 + エラーチェック
npm run dev      # 開発サーバー（localhost:3000）
```

### 現在のビルドページ数

約412ページ（記事13 + イベント233 + 商品25 + 選手124 + 固定ページ）

---

## 9. スキル一覧

Claude Codeの `/スキル名` で実行可能。定義は `.claude/commands/` にある。

| スキル | 用途 | 実行タイミング |
|--------|------|---------------|
| `/fetch-events` | イベントデータ更新（JPA + 手動） | 週1回 |
| `/add-event` | 手動イベント追加 | テニスベア等で新規発見時 |
| `/import-articles` | microCMSへの記事入稿 | 記事完成時 |
| `/generate-eyecatch` | 記事アイキャッチ画像生成 | 記事入稿前 |
| `/generate-tweets` | Xポスト候補生成 | 週2-3回 |
| `/generate-video-script` | ショート動画台本生成 | 動画制作時 |
| `/generate-short` | 記事→ショート動画一括生成 | 動画制作時 |
| `/upload-youtube` | YouTube Shortsアップロード | 動画完成後 |
| `/register-base-products` | BASE商品一括登録 | 商品追加後 |
| `/add-product` | 新商品追加ワークフロー | 新デザイン追加時 |
| `/weekly-review` | 週次レビュー・AIチームMTG | 毎週金曜 |
| `/update-sitemap` | サイトマップ確認・更新 | ページ追加後 |

---

## 10. トラブルシューティング

### BASE API トークン期限切れ

```
Error: token expired / 401 Unauthorized
```
→ `node scripts/base-api.mjs auth` で再認証

### BASE API 画像アップロード失敗

```
"不正なパラメーターです。" (bad_params)
```
→ 画像がまだデプロイされていない可能性。先に `git push` してVercelデプロイを完了させる。

```
"画像を取得できませんでした" (no_image)
```
→ URLが正しいか確認。`https://pikura.app/images/shop/{slug}.png` がブラウザでアクセスできるか確認。

### Gemini API レート制限

```
429 / RESOURCE_EXHAUSTED / Quota exceeded
```
→ 数分待って再実行。無料枠は 10RPM / 250RPD。
→ 大量生成時は `DELAY_MS` を増やす（デフォルト3秒）。

### ビルドエラー（型エラー）

```bash
npm run build
```
→ TypeScript strict モードのため、`any` 型や型不整合があるとビルドが通らない。
→ `src/lib/types/` にある型定義と整合させる。

### WSL2 で localhost にアクセスできない

BASE API認証時、WindowsブラウザからWSL2の `localhost:3456` にアクセスできない場合がある。
→ base-api.mjs は「手動コード貼り付け方式」を採用済み。リダイレクトURLをコピペすればOK。

### microCMS 入稿エラー

```
MICROCMS_WRITE_KEY が未設定です
```
→ 環境変数を設定して実行: `MICROCMS_WRITE_KEY=xxx node scripts/import-articles.mjs`

### FFmpeg がない

```
ffmpeg: command not found
```
→ `sudo apt install ffmpeg`

---

## 付録: ディレクトリマップ

```
pikura/
├── CLAUDE.md                    # AI向け技術仕様書
├── OPERATIONS_MANUAL.md         # このマニュアル
├── .env.local                   # 環境変数（git管理外）
├── .base-tokens.json            # BASE APIトークン（git管理外）
├── scripts/
│   ├── fetch-all-events.mjs     # イベント全件取得
│   ├── manual-events.json       # 手動登録イベントデータ
│   ├── import-articles.mjs      # microCMS記事入稿
│   ├── generate-tshirt-designs.mjs  # Tシャツ画像生成
│   ├── base-api.mjs             # BASE API連携
│   ├── base-item-mapping.json   # slug↔item_id対応（自動生成）
│   ├── generate-eyecatch.mjs    # アイキャッチ画像生成
│   ├── generate-tweets.mjs      # ツイート生成
│   ├── article-to-short.mjs     # ショート動画一括生成
│   ├── generate-video-script.mjs    # 動画台本生成
│   ├── generate-short-frames.mjs    # フレーム画像生成
│   ├── generate-short-video.mjs     # FFmpeg動画合成
│   ├── youtube-auth.mjs         # YouTube OAuth認証
│   └── youtube-upload.mjs       # YouTubeアップロード
├── src/
│   ├── app/
│   │   ├── (platform)/          # メインページ群
│   │   │   ├── events/          # イベント一覧・詳細
│   │   │   ├── rankings/        # ランキング
│   │   │   ├── players/         # 選手詳細
│   │   │   ├── shop/            # ショップ一覧・商品詳細
│   │   │   └── pairs/           # ペア募集（準備中）
│   │   ├── (marketing)/         # 記事・メディア
│   │   ├── (auth)/              # 認証
│   │   ├── (mypage)/            # マイページ
│   │   └── api/                 # APIルート
│   ├── lib/
│   │   ├── events/              # イベントデータ・型・フィルター
│   │   ├── ranking/             # ランキングデータ
│   │   ├── shop/                # 商品データ・型
│   │   └── supabase/            # DB接続
│   └── components/
│       ├── ui/                  # shadcn/ui コンポーネント
│       ├── features/            # 機能別コンポーネント
│       └── layouts/             # ヘッダー・フッター
├── public/
│   ├── images/
│   │   ├── articles/            # 記事アイキャッチ
│   │   └── shop/                # 商品モックアップ（25枚、計31MB）
│   └── videos/                  # ショート動画MP4
└── .claude/
    └── commands/                # スキル定義
```

---

## 付録: コスト一覧

| サービス | 用途 | 費用 |
|---------|------|------|
| Vercel | ホスティング | ¥0（Hobbyプラン） |
| Supabase | DB・認証 | ¥0（Freeプラン） |
| microCMS | 記事CMS | ¥0（Hobbyプラン） |
| BASE | EC・決済 | ¥0（スタンダードプラン）+ 販売手数料6.6%+40円 |
| Leaflet/OSM | 地図表示 | ¥0 |
| JPA API | イベント取得 | ¥0 |
| Gemini API テキスト | 台本・ツイート | ¥0（無料枠） |
| Gemini API 画像 | Tシャツ・アイキャッチ | ¥3-6/枚 |
| Google TTS | ナレーション音声 | ¥0（月100万文字無料） |
| YouTube API | 動画アップロード | ¥0 |
