import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        お探しのページが見つかりませんでした
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        URLが正しいかご確認ください。ページが移動または削除された可能性があります。
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Button asChild>
          <Link href="/">トップページに戻る</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/rankings">ランキングを見る</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/articles">記事を読む</Link>
        </Button>
      </div>
    </div>
  );
}
