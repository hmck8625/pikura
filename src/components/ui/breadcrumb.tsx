import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav
      className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
      aria-label="パンくずリスト"
    >
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="mx-1">/</span>}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-foreground hover:underline"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
