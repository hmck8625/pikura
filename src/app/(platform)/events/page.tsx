import type { Metadata } from "next";
import { getUpcomingEvents, getPastEvents } from "@/lib/events/data";
import { EventList } from "@/components/features/events/event-list";

export const metadata: Metadata = {
  title: "イベント・大会情報",
  description:
    "ピックルボールの大会、体験会、講習会などの最新イベント情報一覧。JPA公式情報をもとに全国のイベントをまとめています。",
  alternates: {
    canonical: "/events",
  },
  openGraph: {
    title: "イベント・大会情報 | ピクラ",
    description:
      "ピックルボールの大会・体験会・講習会の最新情報。JPA公式データを元に掲載。",
    images: ["/api/og?type=events"],
  },
};

export default function EventsPage() {
  const upcomingEvents = getUpcomingEvents();
  const pastEvents = getPastEvents();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">イベント・大会情報</h1>
        <p className="mt-2 text-muted-foreground">
          JPA（日本ピックルボール協会）公式サイトの情報をもとに、全国のピックルボール大会・体験会・講習会をまとめています。
        </p>
      </div>
      <EventList upcomingEvents={upcomingEvents} pastEvents={pastEvents} />
    </div>
  );
}
