import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const metadata: Metadata = {
  title: "イベント作成",
  robots: { index: false, follow: false },
};

export default function EventNewPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">イベント作成</h1>
      <Card>
        <CardHeader>
          <CardTitle>イベント情報を入力</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                タイトル
              </label>
              <Input id="title" placeholder="イベントのタイトル" />
            </div>
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium">
                日時
              </label>
              <Input id="date" type="date" />
            </div>
            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">
                場所
              </label>
              <Input id="location" placeholder="開催場所" />
            </div>
            <div className="space-y-2">
              <label htmlFor="capacity" className="text-sm font-medium">
                定員
              </label>
              <Input id="capacity" type="number" placeholder="32" />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                説明
              </label>
              <Textarea
                id="description"
                placeholder="イベントの詳細を入力してください"
                rows={5}
              />
            </div>
            <Button type="submit" className="w-full">
              イベントを作成
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
