export type Product = {
  name: string;
  description: string;
  price: string;
  imageUrl?: string;
  affiliateUrl: string;
  store: "rakuten" | "amazon" | "other";
  badge?: string;
};

const storeLabels: Record<string, string> = {
  rakuten: "楽天市場",
  amazon: "Amazon",
  other: "詳細",
};

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <p className="text-sm font-medium">{product.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {product.description}
        </p>
      </div>
      <div className="ml-4 flex flex-shrink-0 items-center gap-3">
        <span className="text-sm font-medium">{product.price}</span>
        <a
          href={product.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="text-xs text-muted-foreground underline hover:text-primary"
        >
          {storeLabels[product.store]}
        </a>
      </div>
    </div>
  );
}

export function ProductList({
  products,
  title,
}: {
  products: Product[];
  title?: string;
}) {
  if (products.length === 0) return null;

  return (
    <div className="mt-10 border-t pt-6">
      <p className="mb-1 text-xs text-muted-foreground">参考リンク</p>
      {title && (
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          {title}
        </p>
      )}
      <div className="divide-y">
        {products.map((product) => (
          <ProductCard key={product.name} product={product} />
        ))}
      </div>
      <p className="mt-3 text-[10px] text-muted-foreground/60">
        ※ 上記はアフィリエイトリンクを含みます
      </p>
    </div>
  );
}
