"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/shop/types";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/shop/types";

const categoryColors: Record<string, string> = {
  humor: "bg-amber-100 text-amber-800",
  stylish: "bg-slate-100 text-slate-800",
  japanese: "bg-red-100 text-red-800",
  design: "bg-purple-100 text-purple-800",
  brand: "bg-sky-100 text-sky-800",
};

function ProductImagePlaceholder({ product }: { product: Product }) {
  return (
    <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-muted to-muted/50">
      <div className="flex flex-col items-center gap-2 px-4 text-center">
        <span className="text-3xl">👕</span>
        <span className="text-sm font-bold text-muted-foreground">
          {product.designText
            ? product.designText.split("\n")[0]
            : product.name}
        </span>
      </div>
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const colorClass = categoryColors[product.category] ?? "bg-muted text-muted-foreground";

  return (
    <Card className="overflow-hidden transition-colors hover:bg-muted/50">
      <Link href={`/shop/${product.slug}`}>
        <div className="relative aspect-square">
          <Image
            src={product.imagePath}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={(e) => {
              // 画像が存在しない場合はプレースホルダーを表示
              const target = e.currentTarget;
              target.style.display = "none";
              const placeholder = target.parentElement?.querySelector(
                "[data-placeholder]",
              );
              if (placeholder instanceof HTMLElement) {
                placeholder.style.display = "flex";
              }
            }}
          />
          <div
            data-placeholder
            className="absolute inset-0 hidden items-center justify-center bg-gradient-to-br from-muted to-muted/50"
          >
            <div className="flex flex-col items-center gap-2 px-4 text-center">
              <span className="text-3xl">👕</span>
              <span className="text-sm font-bold text-muted-foreground">
                {product.designText
                  ? product.designText.split("\n")[0]
                  : product.name}
              </span>
            </div>
          </div>
        </div>
      </Link>
      <CardHeader className="pb-2">
        <div className="mb-1 flex items-center gap-2">
          <Badge variant="secondary" className={colorClass}>
            {PRODUCT_CATEGORY_LABELS[product.category]}
          </Badge>
        </div>
        <CardTitle className="text-base">
          <Link href={`/shop/${product.slug}`} className="hover:underline">
            {product.name}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
          {product.description}
        </p>
        <p className="text-lg font-bold text-primary">
          ¥{product.price.toLocaleString()}
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            (税込)
          </span>
        </p>
      </CardContent>
    </Card>
  );
}
