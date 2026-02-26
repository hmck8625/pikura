import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Props = {
  params: Promise<{ username: string }>;
};

const mockPlayers: Record<
  string,
  {
    displayName: string;
    prefecture: string;
    playStyle: string;
    bio: string;
    rank: number;
    points: number;
    winRate: number;
    totalMatches: number;
  }
> = {
  tanaka: {
    displayName: "田中 太郎",
    prefecture: "東京都",
    playStyle: "オールラウンド",
    bio: "2020年からピックルボールを始め、数々の大会で好成績を収めています。",
    rank: 1,
    points: 2450,
    winRate: 78,
    totalMatches: 120,
  },
  suzuki: {
    displayName: "鈴木 花子",
    prefecture: "大阪府",
    playStyle: "ネットプレー",
    bio: "元テニス選手。2022年にピックルボールに転向し、急速に頭角を現しています。",
    rank: 2,
    points: 2380,
    winRate: 75,
    totalMatches: 95,
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const player = mockPlayers[username];
  if (!player) return { title: "選手が見つかりません" };

  return {
    title: `${player.displayName} | ランキング・戦績`,
    description: `${player.displayName}のピックルボールランキング、戦績、大会結果。現在のランキング: ${player.rank}位`,
    openGraph: {
      title: `${player.displayName} | ピックルボールランキング`,
      description: `ランキング ${player.rank}位 | 勝率 ${player.winRate}%`,
      images: [`/api/og?type=player&username=${username}`],
    },
  };
}

export default async function PlayerPage({ params }: Props) {
  const { username } = await params;
  const player = mockPlayers[username];

  if (!player) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-2xl font-bold">
                {player.displayName.charAt(0)}
              </div>
              <CardTitle className="mt-4">{player.displayName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">所在地:</span>{" "}
                {player.prefecture}
              </p>
              <p>
                <span className="text-muted-foreground">プレイスタイル:</span>{" "}
                <Badge variant="secondary">{player.playStyle}</Badge>
              </p>
              <Separator className="my-3" />
              <p className="text-muted-foreground">{player.bio}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 md:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold">{player.rank}</p>
                <p className="text-sm text-muted-foreground">ランキング</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold">{player.points.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">ポイント</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold">{player.winRate}%</p>
                <p className="text-sm text-muted-foreground">勝率</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>戦績</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                総試合数: {player.totalMatches}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
