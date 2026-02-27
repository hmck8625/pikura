"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "./product-card";
import type { Product, ProductCategory } from "@/lib/shop/types";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/shop/types";

type Props = {
  products: Product[];
};

const categories: (ProductCategory | "all")[] = [
  "all",
  "humor",
  "stylish",
  "japanese",
  "design",
  "brand",
];

export function ShopPageClient({ products }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<
    ProductCategory | "all"
  >("all");
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedCategory !== "all") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          p.description.includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [products, selectedCategory, search]);

  const activeFilterCount =
    (selectedCategory !== "all" ? 1 : 0) + (search.trim() ? 1 : 0);

  return (
    <div>
      {/* フィルターバー */}
      <div className="mb-6 space-y-4">
        {/* カテゴリピル */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === "all" ? "すべて" : PRODUCT_CATEGORY_LABELS[cat]}
            </Button>
          ))}
        </div>

        {/* 検索 */}
        <div className="flex gap-2">
          <Input
            placeholder="デザインを検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedCategory("all");
                setSearch("");
              }}
            >
              クリア
            </Button>
          )}
        </div>
      </div>

      {/* 件数 */}
      <div className="mb-4 flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          {filteredProducts.length}件のデザイン
        </p>
        {activeFilterCount > 0 && (
          <Badge variant="secondary">{activeFilterCount}件のフィルター</Badge>
        )}
      </div>

      {/* 商品グリッド */}
      {filteredProducts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border py-12 text-center text-muted-foreground">
          <p>条件に一致するデザインが見つかりません。</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSelectedCategory("all");
              setSearch("");
            }}
          >
            フィルターをクリア
          </Button>
        </div>
      )}

      {/* 注意書き */}
      <div className="mt-12 rounded-lg border bg-muted/30 p-6">
        <h3 className="mb-2 text-sm font-semibold">ご購入について</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            全商品、吸水速乾ドライ素材を使用したスポーツTシャツです。
          </li>
          <li>受注生産のため、ご注文から発送まで3-7営業日いただきます。</li>
          <li>
            「購入する」ボタンから外部ショップ（BASE）に移動してお手続きいただけます。
          </li>
        </ul>
      </div>
    </div>
  );
}
