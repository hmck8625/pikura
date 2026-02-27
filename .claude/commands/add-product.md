# 新商品追加スキル

新しいTシャツデザインを追加し、pikura.app + BASE に反映するワークフロー。

## 手順

### Step 1: 商品データを追加

1. `src/lib/shop/data.ts` の `PRODUCTS` 配列に新商品を追加:
   ```typescript
   {
     id: "XX",  // 連番
     slug: "new-design-slug",
     name: "デザイン名",
     nameEn: "Design Name",
     description: "商品説明文。ポリエステル100% 吸水速乾ドライ素材。",
     category: "humor" | "stylish" | "japanese" | "design" | "brand",
     price: 4000,
     designText: "Tシャツに印刷されるテキスト",
     designConcept: "デザインコンセプトの説明",
     imagePath: "/images/shop/new-design-slug.png",
     purchaseUrl: null,  // BASE登録後に更新
     tags: ["タグ1", "タグ2"],
     published: true,
   }
   ```

2. `scripts/generate-tshirt-designs.mjs` の `DESIGNS` に追加:
   ```javascript
   "new-design-slug": {
     text: "デザインテキスト",
     style: "スタイルの説明（英語推奨）",
   },
   ```

3. `scripts/base-api.mjs` の `PRODUCTS` 配列にも追加:
   ```javascript
   { slug: "new-design-slug", name: "デザイン名", price: 4000, desc: "説明文" },
   ```

### Step 2: モックアップ画像を生成

```bash
GEMINI_API_KEY=$GEMINI_API_KEY node scripts/generate-tshirt-designs.mjs new-design-slug
```

→ `public/images/shop/new-design-slug.png` が生成される

### Step 3: ビルド確認

```bash
npm run build
```

→ `/shop/new-design-slug` が静的生成されることを確認

### Step 4: デプロイ

```bash
git add public/images/shop/new-design-slug.png src/lib/shop/data.ts scripts/
git commit -m "Add new product: デザイン名"
git push origin main
```

→ Vercel自動デプロイ。画像がpikura.appで公開される。

### Step 5: BASEに登録

```bash
node scripts/base-api.mjs status          # トークン確認
node scripts/base-api.mjs register --slug new-design-slug    # 商品登録
node scripts/base-api.mjs upload-images --slug new-design-slug  # 画像登録
```

### Step 6: 購入URLを設定

BASEの管理画面で商品ページURLを確認し、`src/lib/shop/data.ts` の `purchaseUrl` を更新。

### Step 7: サイトマップ確認

`src/app/sitemap.ts` は `getAllProductSlugs()` を使っているため、自動で新商品が含まれる。

## チェックリスト

- [ ] `lib/shop/data.ts` に商品データ追加
- [ ] `scripts/generate-tshirt-designs.mjs` にデザイン定義追加
- [ ] `scripts/base-api.mjs` に商品データ追加
- [ ] モックアップ画像生成
- [ ] ビルド成功確認
- [ ] デプロイ（git push）
- [ ] BASE商品登録 + 画像アップロード
- [ ] purchaseUrl 更新
