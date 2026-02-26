import Image from "next/image";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const footerLinks = [
  {
    title: "サービス",
    links: [
      { label: "記事", href: "/articles" },
      { label: "ランキング", href: "/rankings" },
      { label: "イベント", href: "/events" },
      { label: "ペア募集", href: "/pairs" },
    ],
  },
  {
    title: "サポート",
    links: [
      { label: "利用規約", href: "/terms" },
      { label: "プライバシーポリシー", href: "/privacy" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/brand/logo-icon.png"
                alt="pikura"
                width={28}
                height={28}
                className="h-7 w-7"
              />
              <span className="text-lg font-bold tracking-tight text-primary">pikura</span>
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              日本最大のピックルボールプラットフォーム
            </p>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="mb-3 text-sm font-semibold">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} pikura. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
