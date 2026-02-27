# BASE商品登録スキル

BASE APIを使って商品データを一括登録・画像アップロードする。

## 事前準備（人間側）

1. https://developers.thebase.in/ でアプリ登録
2. redirect_uri: `http://localhost:3456/callback`
3. scope: `read_items write_items`
4. `.env.local` に追加:
   ```
   BASE_CLIENT_ID=xxx
   BASE_CLIENT_SECRET=xxx
   ```

## 実行手順

### Step 1: ステータス確認

```bash
node scripts/base-api.mjs status
```

トークンが未取得 or 期限切れの場合はStep 2へ。

### Step 2: OAuth2認証（初回 or 期限切れ時）

```bash
node scripts/base-api.mjs auth
```

表示されるURLをブラウザで開き、BASEにログインして認可する。
コールバックサーバーが自動でトークンを取得・保存する。

### Step 3: 商品一括登録

```bash
node scripts/base-api.mjs register
```

25商品をBASEに一括登録。結果は `scripts/base-item-mapping.json` に保存される。

特定商品のみ:
```bash
node scripts/base-api.mjs register --slug stay-out-of-the-kitchen
```

### Step 4: 画像アップロード

```bash
node scripts/base-api.mjs upload-images
```

`public/images/shop/` の画像を各商品にアップロード。

## ファイル

- `scripts/base-api.mjs` — メインスクリプト
- `scripts/base-item-mapping.json` — 商品ID⇔slugマッピング（自動生成）
- `.base-tokens.json` — OAuth2トークン（自動生成、gitignore対象）

## 注意事項

- BASE APIは1時間5,000回、1日100,000回のレート制限あり
- アクセストークンの有効期限は1時間。自動リフレッシュ対応
- `.base-tokens.json` はgitにコミットしないこと
