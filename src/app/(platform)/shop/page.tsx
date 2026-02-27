import type { Metadata } from "next";
import { getProducts } from "@/lib/shop/data";
import { ShopPageClient } from "@/components/features/shop/shop-page-client";

export const metadata: Metadata = {
  title: "ピックルボール Tシャツ ショップ",
  description:
    "ピックルボールプレイヤーのための「あるあるネタ」Tシャツ。キッチン侵入、パートナーのせい、ディンク修行中など、コートで話題になるデザイン25種。吸水速乾ドライ素材。",
  alternates: {
    canonical: "/shop",
  },
  openGraph: {
    title: "ピックルボール Tシャツ ショップ | pikura",
    description:
      "ピクラーなら共感必至のTシャツ25種。あるあるネタからスタイリッシュデザインまで。¥4,000〜",
  },
};

export default function ShopPage() {
  const products = getProducts();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          ピックルボール Tシャツ
        </h1>
        <p className="mt-2 text-muted-foreground">
          ピクラーなら共感必至。コートで着れば会話が始まる、あるあるネタTシャツ。
          <br />
          吸水速乾ドライ素材 / 受注生産 / 全国送料込み
        </p>
      </div>

      <ShopPageClient products={products} />
    </div>
  );
}
