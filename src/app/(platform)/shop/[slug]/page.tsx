import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProductImage } from "@/components/features/shop/product-image";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/features/seo/json-ld";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  getProductBySlug,
  getAllProductSlugs,
  getProducts,
  PRODUCT_CATEGORY_LABELS,
} from "@/lib/shop/data";
import { ProductCard } from "@/components/features/shop/product-card";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return { title: "商品が見つかりません" };
  }

  return {
    title: `${product.name} | ピックルボール Tシャツ`,
    description: product.description,
    alternates: {
      canonical: `/shop/${slug}`,
    },
    openGraph: {
      title: `${product.name} | pikura SHOP`,
      description: product.description,
      images: [product.imagePath],
    },
  };
}

const categoryColors: Record<string, string> = {
  humor: "bg-amber-100 text-amber-800",
  stylish: "bg-slate-100 text-slate-800",
  japanese: "bg-red-100 text-red-800",
  design: "bg-purple-100 text-purple-800",
  brand: "bg-sky-100 text-sky-800",
};

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // 同カテゴリの関連商品（自分を除く、最大4つ）
  const relatedProducts = getProducts()
    .filter((p) => p.category === product.category && p.slug !== slug)
    .slice(0, 4);

  const colorClass =
    categoryColors[product.category] ?? "bg-muted text-muted-foreground";

  return (
    <>
      <ProductJsonLd product={product} />
      <BreadcrumbJsonLd
        items={[
          { name: "ホーム", url: "https://pikura.app" },
          { name: "ショップ", url: "https://pikura.app/shop" },
          { name: product.name, url: `https://pikura.app/shop/${slug}` },
        ]}
      />
      <div className="container mx-auto px-4 py-12">
        <Breadcrumb
          items={[
            { label: "ホーム", href: "/" },
            { label: "ショップ", href: "/shop" },
            { label: product.name },
          ]}
        />

        <div className="grid gap-8 lg:grid-cols-2">
          {/* 左: 商品画像 */}
          <ProductImage
            src={product.imagePath}
            alt={product.name}
            designText={
              product.designText
                ? product.designText.split("\n")[0]
                : product.name
            }
            priority
          />

          {/* 右: 商品情報 */}
          <div>
            <div className="mb-4">
              <Badge variant="secondary" className={colorClass}>
                {PRODUCT_CATEGORY_LABELS[product.category]}
              </Badge>
            </div>

            <h1 className="mb-2 text-2xl font-bold lg:text-3xl">
              {product.name}
            </h1>

            <p className="mb-6 text-muted-foreground">{product.description}</p>

            <div className="mb-6">
              <span className="text-3xl font-bold text-primary">
                ¥{product.price.toLocaleString()}
              </span>
              <span className="ml-2 text-sm text-muted-foreground">(税込)</span>
            </div>

            {/* 購入ボタン */}
            {product.purchaseUrl ? (
              <Button asChild size="lg" className="mb-4 w-full sm:w-auto">
                <a
                  href={product.purchaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  購入する（BASEショップへ）
                </a>
              </Button>
            ) : (
              <Button size="lg" className="mb-4 w-full sm:w-auto" disabled>
                近日発売予定
              </Button>
            )}

            <Separator className="my-6" />

            {/* 商品詳細 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">商品詳細</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">素材</span>
                  <span>ポリエステル100%（吸水速乾ドライ）</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">サイズ</span>
                  <span>S / M / L / XL / XXL</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">カラー</span>
                  <span>ホワイト / ブラック</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">生産方式</span>
                  <span>受注生産（注文後3-7営業日で発送）</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">送料</span>
                  <span>全国一律無料</span>
                </div>
              </CardContent>
            </Card>

            {/* デザインコンセプト */}
            {product.designConcept && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-semibold">デザインコンセプト</h3>
                <p className="text-sm text-muted-foreground">
                  {product.designConcept}
                </p>
              </div>
            )}

            {/* タグ */}
            <div className="mt-6 flex flex-wrap gap-1">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* 関連商品 */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 text-xl font-bold">関連デザイン</h2>
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* ショップへ戻る */}
        <div className="mt-12 text-center">
          <Button asChild variant="outline">
            <Link href="/shop">すべてのデザインを見る</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
