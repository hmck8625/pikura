import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const metadata: Metadata = {
  title: "プロフィール編集",
  robots: { index: false, follow: false },
};

export default function MypageEditPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">プロフィール編集</h1>
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="displayName" className="text-sm font-medium">
                表示名
              </label>
              <Input id="displayName" placeholder="表示名を入力" />
            </div>
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                ユーザー名
              </label>
              <Input id="username" placeholder="半角英数字" />
            </div>
            <div className="space-y-2">
              <label htmlFor="prefecture" className="text-sm font-medium">
                所在地
              </label>
              <Input id="prefecture" placeholder="例: 東京都" />
            </div>
            <div className="space-y-2">
              <label htmlFor="bio" className="text-sm font-medium">
                自己紹介
              </label>
              <Textarea
                id="bio"
                placeholder="自己紹介を入力してください"
                rows={4}
              />
            </div>
            <Button type="submit" className="w-full">
              保存
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
