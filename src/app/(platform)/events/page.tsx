import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "イベント一覧",
  description:
    "ピックルボールの大会、練習会、体験会などのイベント情報一覧。",
};

const mockEvents = [
  {
    id: "1",
    title: "東京オープン 2026 春",
    date: "2026-04-15",
    location: "東京都江東区",
    level: "中級〜上級",
    capacity: 64,
    participantsCount: 42,
  },
  {
    id: "2",
    title: "初心者歓迎！大阪ピックルボール体験会",
    date: "2026-03-20",
    location: "大阪府大阪市",
    level: "初心者",
    capacity: 30,
    participantsCount: 18,
  },
  {
    id: "3",
    title: "名古屋ミックスダブルス大会",
    date: "2026-04-05",
    location: "愛知県名古屋市",
    level: "中級",
    capacity: 32,
    participantsCount: 28,
  },
  {
    id: "4",
    title: "福岡ピックルボールカップ",
    date: "2026-05-10",
    location: "福岡県福岡市",
    level: "全レベル",
    capacity: 48,
    participantsCount: 12,
  },
];

export default function EventsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">イベント一覧</h1>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {mockEvents.map((event) => (
          <Card key={event.id}>
            <CardHeader>
              <div className="mb-2 flex gap-2">
                <Badge variant="outline">{event.level}</Badge>
              </div>
              <CardTitle className="text-lg">
                <Link
                  href={`/events/${event.id}`}
                  className="hover:underline"
                >
                  {event.title}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>{event.date}</p>
              <p>{event.location}</p>
              <p>
                参加者: {event.participantsCount}/{event.capacity}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
