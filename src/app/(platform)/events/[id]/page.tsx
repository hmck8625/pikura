import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type Props = {
  params: Promise<{ id: string }>;
};

const mockEvents: Record<
  string,
  {
    title: string;
    description: string;
    date: string;
    location: string;
    level: string;
    capacity: number;
    participantsCount: number;
    organizer: string;
  }
> = {
  "1": {
    title: "東京オープン 2026 春",
    description:
      "東京で開催される春の大規模ピックルボール大会です。中級〜上級の選手を対象に、シングルス・ダブルスの部門で開催されます。",
    date: "2026-04-15",
    location: "東京都江東区 有明テニスの森公園",
    level: "中級〜上級",
    capacity: 64,
    participantsCount: 42,
    organizer: "日本ピックルボール協会",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = mockEvents[id];
  if (!event) return { title: "イベントが見つかりません" };

  return {
    title: event.title,
    description: event.description.slice(0, 120),
    openGraph: {
      title: event.title,
      description: event.description.slice(0, 120),
      images: [`/api/og?type=event&id=${id}`],
    },
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const event = mockEvents[id];

  if (!event) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="mb-4">
        <Badge variant="outline">{event.level}</Badge>
      </div>
      <h1 className="mb-4 text-3xl font-bold">{event.title}</h1>
      <Separator className="mb-8" />

      <div className="grid gap-8 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <p className="text-muted-foreground">{event.description}</p>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">イベント情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">日時</p>
                <p>{event.date}</p>
              </div>
              <div>
                <p className="text-muted-foreground">場所</p>
                <p>{event.location}</p>
              </div>
              <div>
                <p className="text-muted-foreground">参加者</p>
                <p>
                  {event.participantsCount}/{event.capacity}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">主催</p>
                <p>{event.organizer}</p>
              </div>
              <Button className="mt-4 w-full">参加する</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
