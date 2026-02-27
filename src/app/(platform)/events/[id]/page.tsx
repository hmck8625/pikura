import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  getEventById,
  getAllEventIds,
  EVENT_CATEGORY_LABELS,
} from "@/lib/events/data";

type Props = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return getAllEventIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = getEventById(id);
  if (!event) return { title: "イベントが見つかりません" };

  const description = event.description.slice(0, 120);

  return {
    title: event.title,
    description,
    alternates: {
      canonical: `/events/${id}`,
    },
    openGraph: {
      title: event.title,
      description,
      images: [`/api/og?type=event&id=${id}`],
    },
  };
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "日程未定";
  return new Date(dateString).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const event = getEventById(id);

  if (!event) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="mb-2">
        <Link
          href="/events"
          className="text-sm text-muted-foreground hover:underline"
        >
          イベント一覧に戻る
        </Link>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge variant="outline">
          {EVENT_CATEGORY_LABELS[event.category]}
        </Badge>
        {event.prefecture && (
          <Badge variant="secondary">{event.prefecture}</Badge>
        )}
      </div>
      <h1 className="mb-4 text-2xl font-bold sm:text-3xl">{event.title}</h1>
      <Separator className="mb-8" />

      <div className="grid gap-8 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <p className="whitespace-pre-wrap text-muted-foreground">
            {event.description}
          </p>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">イベント情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">日時</p>
                <p>{formatDate(event.eventDate)}</p>
              </div>
              {event.location && (
                <div>
                  <p className="text-muted-foreground">場所</p>
                  <p>{event.location}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">カテゴリ</p>
                <p>{EVENT_CATEGORY_LABELS[event.category]}</p>
              </div>
              <div>
                <p className="text-muted-foreground">情報元</p>
                <p>日本ピックルボール協会 (JPA)</p>
              </div>
              <Button asChild className="mt-4 w-full">
                <a
                  href={event.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  JPA公式サイトで詳細を見る
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
