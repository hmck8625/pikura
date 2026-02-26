import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "マイページ",
  robots: { index: false, follow: false },
};

export default function MypagePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">マイページ</h1>
        <Button asChild variant="outline">
          <Link href="/mypage/edit">プロフィール編集</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>プロフィール</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>ログインしてプロフィールを確認してください。</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>参加イベント</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>参加予定のイベントはありません。</p>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      <Card>
        <CardHeader>
          <CardTitle>最近の試合結果</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>試合結果はまだ登録されていません。</p>
        </CardContent>
      </Card>
    </div>
  );
}
