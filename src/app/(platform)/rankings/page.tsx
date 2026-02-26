import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "ランキング",
  description:
    "ピックルボール選手のランキング一覧。男子シングルス、女子シングルス、ダブルスなどカテゴリ別に確認できます。",
};

const mockRankings = [
  { rank: 1, name: "田中 太郎", username: "tanaka", points: 2450, winRate: 78, category: "男子シングルス" },
  { rank: 2, name: "鈴木 花子", username: "suzuki", points: 2380, winRate: 75, category: "女子シングルス" },
  { rank: 3, name: "佐藤 健一", username: "sato", points: 2210, winRate: 72, category: "男子シングルス" },
  { rank: 4, name: "山田 美咲", username: "yamada", points: 2150, winRate: 70, category: "女子シングルス" },
  { rank: 5, name: "高橋 大輔", username: "takahashi", points: 2080, winRate: 68, category: "男子シングルス" },
];

export default function RankingsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">ランキング</h1>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                  <th className="px-6 py-3">順位</th>
                  <th className="px-6 py-3">選手名</th>
                  <th className="px-6 py-3">カテゴリ</th>
                  <th className="px-6 py-3">ポイント</th>
                  <th className="px-6 py-3">勝率</th>
                </tr>
              </thead>
              <tbody>
                {mockRankings.map((player) => (
                  <tr key={player.rank} className="border-b last:border-0">
                    <td className="px-6 py-4 font-bold">{player.rank}</td>
                    <td className="px-6 py-4">{player.name}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">{player.category}</Badge>
                    </td>
                    <td className="px-6 py-4">{player.points.toLocaleString()}</td>
                    <td className="px-6 py-4">{player.winRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
