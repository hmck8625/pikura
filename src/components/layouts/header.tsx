import Image from "next/image";
import Link from "next/link";
import { MobileNav } from "@/components/layouts/mobile-nav";

const navItems = [
  { label: "記事", href: "/articles" },
  { label: "ランキング", href: "/rankings" },
  { label: "イベント", href: "/events" },
  { label: "ペア募集", href: "/pairs" },
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/brand/logo-icon.png"
            alt="pikura"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="text-xl font-bold tracking-tight text-primary">pikura</span>
        </Link>

        <nav className="hidden md:flex md:items-center md:gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <MobileNav navItems={navItems.map((item) => ({ ...item }))} />
        </div>
      </div>
    </header>
  );
}
