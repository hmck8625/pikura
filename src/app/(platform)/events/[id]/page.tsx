import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { EventJsonLd, BreadcrumbJsonLd } from "@/components/features/seo/json-ld";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  getEventById,
  getAllEventIds,
  EVENT_CATEGORY_LABELS,
} from "@/lib/events/data";
import {
  EVENT_LEVEL_LABELS,
  EVENT_FORMAT_LABELS,
  EVENT_SOURCE_LABELS,
  REGISTRATION_STATUS_LABELS,
} from "@/lib/events/types";

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

const SOURCE_CTA_LABELS: Record<string, string> = {
  jpa: "JPA公式サイトで詳細を見る",
  tennisbear: "テニスベアで詳細を見る",
  pjf: "PJF公式サイトで詳細を見る",
  manual: "詳細を見る",
};

const LEVEL_COLORS: Record<string, string> = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-yellow-100 text-yellow-800",
  advanced: "bg-red-100 text-red-800",
  open: "bg-blue-100 text-blue-800",
};

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const event = getEventById(id);

  if (!event) {
    notFound();
  }

  return (
    <>
      <EventJsonLd event={event} />
      <BreadcrumbJsonLd
        items={[
          { name: "ホーム", url: "https://pikura.app" },
          { name: "イベント", url: "https://pikura.app/events" },
          { name: event.title, url: `https://pikura.app/events/${id}` },
        ]}
      />
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <Breadcrumb
          items={[
            { label: "ホーム", href: "/" },
            { label: "イベント", href: "/events" },
            { label: event.title },
          ]}
        />
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant="outline">
            {EVENT_CATEGORY_LABELS[event.category]}
          </Badge>
          {event.prefecture && (
            <Badge variant="secondary">{event.prefecture}</Badge>
          )}
          {event.level !== "unknown" && (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${LEVEL_COLORS[event.level] ?? ""}`}>
              {EVENT_LEVEL_LABELS[event.level]}
            </span>
          )}
          {event.duprReflected === true && (
            <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
              DUPR反映
            </span>
          )}
          {event.format.filter((f) => f !== "unknown").length > 0 && (
            event.format
              .filter((f) => f !== "unknown")
              .map((f) => (
                <Badge key={f} variant="secondary">
                  {EVENT_FORMAT_LABELS[f]}
                </Badge>
              ))
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
                  {event.eventEndDate && event.eventEndDate !== event.eventDate && (
                    <p className="text-xs text-muted-foreground">
                      〜 {formatDate(event.eventEndDate)}
                    </p>
                  )}
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
                {event.entryFee && (
                  <div>
                    <p className="text-muted-foreground">参加費</p>
                    <p>{event.entryFee}</p>
                  </div>
                )}
                {event.registrationStatus !== "unknown" && (
                  <div>
                    <p className="text-muted-foreground">募集状況</p>
                    <p className={event.registrationStatus === "open" ? "font-medium text-green-600" : "text-gray-500"}>
                      {REGISTRATION_STATUS_LABELS[event.registrationStatus]}
                    </p>
                  </div>
                )}
                {event.maxParticipants !== null && (
                  <div>
                    <p className="text-muted-foreground">定員</p>
                    <p>
                      {event.currentParticipants !== null
                        ? `${event.currentParticipants} / ${event.maxParticipants}名`
                        : `${event.maxParticipants}名`}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">情報元</p>
                  <p>{EVENT_SOURCE_LABELS[event.source]}</p>
                </div>
                {event.registrationUrl && (
                  <Button asChild className="mt-4 w-full">
                    <a
                      href={event.registrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      申し込む
                    </a>
                  </Button>
                )}
                <Button asChild variant={event.registrationUrl ? "outline" : "default"} className="mt-2 w-full">
                  <a
                    href={event.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {SOURCE_CTA_LABELS[event.source] ?? "詳細を見る"}
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
