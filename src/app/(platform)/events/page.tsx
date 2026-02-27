import type { Metadata } from "next";
import { getEvents } from "@/lib/events/data";
import { EventPageClient } from "@/components/features/events/event-page-client";

export const metadata: Metadata = {
  title: "イベント・大会情報",
  description:
    "ピックルボールの大会、体験会、講習会などの最新イベント情報一覧。JPA・テニスベア・PJFなど複数ソースから全国のイベントをまとめています。",
  alternates: {
    canonical: "/events",
  },
  openGraph: {
    title: "イベント・大会情報 | ピクラ",
    description:
      "ピックルボールの大会・体験会・講習会の最新情報。全国のイベントを網羅。",
    images: ["/api/og?type=events"],
  },
};

export default function EventsPage() {
  const events = getEvents();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">イベント・大会情報</h1>
        <p className="mt-2 text-muted-foreground">
          日本全国のピックルボール大会・体験会・講習会を網羅。JPA、テニスベア、PJFなど複数ソースからイベント情報をまとめています。
        </p>
      </div>
      <EventPageClient events={events} />
    </div>
  );
}
