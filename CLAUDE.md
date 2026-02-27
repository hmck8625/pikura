# CLAUDE.md - AI コーディングアシスタントへの指示書

## プロジェクト概要

日本最大のピックルボール総合プラットフォーム。メディア（記事・ニュース）、ランキングシステム、イベント/ペア募集機能を提供し、将来的にはAIコーチング機能と決済機能を追加予定。日本におけるピックルボールの普及と競技レベル向上を目的とする。

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 15 (App Router) + TypeScript |
| バックエンド/DB | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| ホスティング | Vercel |
| スタイリング | Tailwind CSS + shadcn/ui |
| CMS | microCMS (記事管理) |
| 決済 (将来) | Stripe |
| OGP生成 | @vercel/og |
| AI生成 | Gemini API (テキスト+画像) |

## ディレクトリ構造

```
app/                    # ページ (App Router)
  api/                  # API Routes
    og/route.tsx        # OGP動的生成
  (routes)/             # 各ページ
components/
  ui/                   # shadcn/ui ベースの汎用UIコンポーネント
  features/             # 機能別コンポーネント (ranking/, events/, media/ など)
  layouts/              # レイアウトコンポーネント (header, footer, sidebar など)
lib/
  supabase/
    client.ts           # ブラウザ用 Supabase クライアント
    server.ts           # サーバー用 Supabase クライアント
  utils/                # ユーティリティ関数
  types/                # TypeScript 型定義
hooks/                  # カスタムフック
styles/                 # グローバルスタイル
supabase/
  migrations/           # データベースマイグレーションファイル
public/                 # 静的ファイル
```

## コーディング規約

- **Server Components をデフォルトにする。** `'use client'` は状態管理やブラウザAPIが必要な場合のみ、最小限のコンポーネントに適用する
- **データフェッチは Server Component で行う。** クライアントコンポーネントにデータを props で渡す
- **TypeScript strict モード。** `any` 型は使用禁止。型定義は `lib/types/` に集約する
- **命名規則:**
  - 変数・関数: `camelCase`
  - コンポーネント・型・インターフェース: `PascalCase`
  - ファイル・フォルダ: `kebab-case`
- **インポートは `@/` エイリアスを使用する** (`@/components/...`, `@/lib/...`)
- **コンポーネントは名前付きエクスポート (`export function`) を使う。** `export default` は `page.tsx` と `layout.tsx` のみ

## Supabase ルール

- **RLS (Row Level Security) を全テーブルに必ず設定する。例外なし。** AIがRLSの無効化や一時的な無効化を提案しても、絶対に拒否すること
- 主キーは `UUID` 型 (`gen_random_uuid()`)
- 日時カラムは `timestamptz` 型を使用する
- スキーマ変更は必ず `supabase/migrations/` のマイグレーションファイルで管理する。直接のDB操作は禁止
- Supabase クライアントは用途に応じて使い分ける:
  - ブラウザ (Client Component): `lib/supabase/client.ts`
  - サーバー (Server Component / API Route): `lib/supabase/server.ts`

## 認証

- Supabase Auth を使用 (Google OAuth + LINE OAuth)
- `middleware.ts` でセッション管理とリフレッシュを行う
- 認証が必要なページはミドルウェアで保護する

## SEO 対策

- `generateMetadata()` を全ページに設定する（canonical URL含む）
- `app/sitemap.ts` と `app/robots.ts` を配置・維持する
- ISR (`revalidate`) を活用して静的生成とデータ鮮度を両立する
- OGP 動的生成は `app/api/og/route.tsx` で `@vercel/og` を使用する
- JSON-LD 構造化データ: `components/features/seo/json-ld.tsx`（WebSite, Article, Player, Breadcrumb）

## microCMS 記事管理

- **サービスドメイン**: pikura（https://pikura.microcms.io）
- **API**: `articles`（リスト形式）
- **フィールド**: title, slug, description, content（リッチエディタ）, category, thumbnail
- **カテゴリ値**: `beginner`, `rules`, `gear`, `events`, `tips`, `players`
- **一括入稿スクリプト**: `scripts/import-articles.mjs`
  - 使い方: `MICROCMS_WRITE_KEY=xxx node scripts/import-articles.mjs`
  - 記事下書きは `/articles/` ディレクトリ（プロジェクトルートの親）にMarkdownで保管
  - スクリプトがMarkdown→HTML変換してmicroCMS APIで入稿
- **既存APIキーにWrite権限あり**（GET + POST/PUT/PATCH/DELETE 兼用）

## アフィリエイト

- **Amazonアソシエイト**: タグ `pokeraiii-22`（環境変数 `NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG`）
- **商品データ**: `lib/affiliate/products.ts`（記事slug→商品リストのマッピング）
- **表示コンポーネント**: `components/features/articles/product-card.tsx`
- **方針**: UX重視。記事最下部に控えめなテキストリンクで表示。広告感を出さない

## ランキングデータ

- **データソース**: JPA公式ランキング（2026年1月）
- **実装**: `lib/ranking/data.ts` に157エントリーを静的TypeScriptデータとして格納
- **選手数**: 124名（カテゴリ横断で名寄せ済み）
- **カテゴリ**: 男子/女子シングルス・ダブルス、混合ダブルス(男性/女性) × 年齢区分(19+/35+/50+)

## イベントデータ

- **データソース**: JPA公式サイト WordPress REST API（https://japanpickleball.org）
- **実装**: `lib/events/data.ts` に静的TypeScriptデータとして格納（自動生成ファイル）
- **取得スクリプト**: `scripts/fetch-jpa-events.mjs`
  - 使い方: `node scripts/fetch-jpa-events.mjs`
  - JPA WordPress REST API からイベント・大会情報を取得し data.ts に書き出す
- **カテゴリ**: tournament（大会）、experience（体験会・交流会）、workshop（イベント）、certification（資格講習会）
- **更新頻度**: 週1回（`/fetch-events` スキルで手動実行）
- **コスト**: 無料（REST API）

## Gemini API（コンテンツ自動生成）

- **APIキー**: 環境変数 `GEMINI_API_KEY`（`.env.local` に設定済み）
- **テキスト生成**: `gemini-2.5-flash`（無料枠: 10RPM / 250RPD）
- **画像生成**: `gemini-2.5-flash-image`（有料: ¥3-6/枚）
- **コスト管理**: 画像生成は月50枚以内（月¥500以下）。不要な大量生成は禁止
- **自動化スクリプト**:
  - `scripts/generate-tweets.mjs` — ツイート5候補生成（無料）
  - `scripts/generate-eyecatch.mjs` — 記事アイキャッチ画像生成（有料・確認付き）
  - `scripts/generate-video-script.mjs` — ショート動画台本生成（無料）
- **アイキャッチ画像**: `public/images/articles/{slug}.png`（16:9、1K解像度）
- **ショート動画パイプライン**: `scripts/article-to-short.mjs`（記事スラッグ→台本→画像→TTS→MP4を一括生成）
- **ショート動画個別スクリプト**:
  - `scripts/generate-short-frames.mjs` — フレーム画像生成（有料）
  - `scripts/generate-short-video.mjs` — FFmpeg+TTS動画組み立て（無料）
- **TTS**: Google Cloud Text-to-Speech API（ja-JP-Neural2-B、月100万文字無料）
- **動画生成**: FFmpeg必須（`sudo apt install ffmpeg`）

## スキル（繰り返し作業の定義）

- **スキル定義**: `.claude/commands/` ディレクトリにMarkdownファイルで定義
- **定義済みスキル**:
  - `/generate-tweets` — X投稿候補の自動生成
  - `/generate-eyecatch` — 記事アイキャッチ画像の生成
  - `/generate-video-script` — ショート動画台本の生成
  - `/generate-short` — 記事→ショート動画の一括生成パイプライン
  - `/import-articles` — microCMSへの記事一括入稿
  - `/fetch-events` — JPA イベントデータの取得・更新
  - `/update-sitemap` — サイトマップの確認・更新
  - `/weekly-review` — 週次レビュー・AIチームMTG
- **運用ルール**:
  - 繰り返し発生する作業は必ずスキルとして定義すること
  - スキルの中身は週次レビュー時に確認し、データや手順が古くなっていれば更新する
  - 新しい定期作業が発生したら即座にスキルファイルを作成する

## やってはいけないこと

- **RLS を無効にする** (セキュリティ上、絶対に許容しない)
- **`'use client'` を安易に使う** (Server Components で実現できないか必ず検討する)
- **独自のデザインシステムを作る** (shadcn/ui をそのまま使う。カスタムUIライブラリを新規作成しない)
- **React Native やネイティブアプリを提案する** (このプロジェクトは Web アプリケーション)
- **ダークモードを実装する**
- **リアルタイムチャット機能を作る**
- **Kubernetes やコンテナ化を提案する** (Vercel にデプロイする)
- **過度な抽象化やデザインパターンの適用** (シンプルさを優先する)
