import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "ペア募集",
  description:
    "ピックルボールのダブルス大会に向けたペア募集一覧。パートナーを見つけよう。",
};

const mockPairRequests = [
  {
    id: "1",
    title: "東京オープン春のパートナー募集",
    tournamentName: "東京オープン 2026 春",
    date: "2026-04-15",
    level: "中級〜上級",
    message: "ミックスダブルスのパートナーを探しています。週2回程度練習可能な方を希望します。",
    createdAt: "2026-02-20",
  },
  {
    id: "2",
    title: "名古屋大会のペア募集中",
    tournamentName: "名古屋ミックスダブルス大会",
    date: "2026-04-05",
    level: "中級",
    message: "男性パートナーを募集しています。楽しくプレーできる方、お気軽にご連絡ください。",
    createdAt: "2026-02-18",
  },
  {
    id: "3",
    title: "福岡カップ ダブルスパートナー",
    tournamentName: "福岡ピックルボールカップ",
    date: "2026-05-10",
    level: "初級〜中級",
    message: "初めての大会参加です。一緒に頑張ってくれる方を探しています。",
    createdAt: "2026-02-15",
  },
];

export default function PairsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">ペア募集</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {mockPairRequests.map((pair) => (
          <Card key={pair.id}>
            <CardHeader>
              <div className="mb-2">
                <Badge variant="outline">{pair.level}</Badge>
              </div>
              <CardTitle className="text-lg">{pair.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{pair.tournamentName}</p>
              <p className="text-muted-foreground">{pair.date}</p>
              <p className="text-muted-foreground">{pair.message}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
