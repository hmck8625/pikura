import type { Metadata } from "next";
import { getCoaches, getAvailableAreas } from "@/lib/coaching/data";
import { CoachingPageClient } from "@/components/features/coaching/coaching-page-client";

export const metadata: Metadata = {
  title: "コーチングマッチング｜プロ選手からピックルボールを学ぼう",
  description:
    "ピックルボールのプロ選手・経験豊富なコーチから直接指導を受けられるマッチングサービス。手数料無料。個人レッスン・グループレッスン・クリニックの情報をエリア・レベル別に検索。",
  alternates: {
    canonical: "/coaching",
  },
  openGraph: {
    title: "コーチングマッチング | ピクラ",
    description:
      "プロ選手からピックルボールを学ぼう。手数料無料のコーチングマッチング。",
    images: ["/api/og?type=coaching"],
  },
};

export default function CoachingPage() {
  const coaches = getCoaches();
  const areas = getAvailableAreas();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">コーチングマッチング</h1>
        <p className="mt-2 text-muted-foreground">
          プロ選手・経験豊富なコーチからピックルボールを直接学べます。掲載無料・手数料ゼロ。ピクラ経由のお申し込みでレッスン料5%割引。
        </p>
      </div>
      <CoachingPageClient coaches={coaches} areas={areas} />
    </div>
  );
}
