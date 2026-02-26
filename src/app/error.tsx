"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="text-6xl font-bold">500</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        エラーが発生しました
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        一時的な問題が発生しています。しばらくしてからもう一度お試しください。
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Button onClick={reset}>
          もう一度試す
        </Button>
        <Button asChild variant="outline">
          <a href="/">トップページに戻る</a>
        </Button>
      </div>
    </div>
  );
}
