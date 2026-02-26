import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "ログイン",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <Link href="/" className="mb-4 text-2xl font-bold tracking-tight">
          pikura
        </Link>
        <CardTitle className="text-xl">ログイン</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button variant="outline" className="w-full">
          Googleでログイン
        </Button>
        <Button variant="outline" className="w-full">
          LINEでログイン
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          ログインすることで、
          <Link href="/terms" className="underline">
            利用規約
          </Link>
          と
          <Link href="/privacy" className="underline">
            プライバシーポリシー
          </Link>
          に同意したものとみなされます。
        </p>
      </CardContent>
    </Card>
  );
}
