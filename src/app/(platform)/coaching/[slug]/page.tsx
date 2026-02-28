import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  getCoachBySlug,
  getAllCoachSlugs,
} from "@/lib/coaching/data";
import {
  COACHING_TYPE_LABELS,
  TARGET_LEVEL_LABELS,
  CONTACT_METHOD_LABELS,
  AVAILABILITY_LABELS,
} from "@/lib/coaching/types";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllCoachSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const coach = getCoachBySlug(slug);
  if (!coach) return { title: "コーチが見つかりません" };

  const areas = coach.areas.join("・");
  const description = `${coach.displayName}のピックルボールコーチング情報。${areas}エリアで${coach.coachingTypes.map((t) => COACHING_TYPE_LABELS[t]).join("・")}を提供。${coach.priceRange}`;

  return {
    title: `${coach.displayName} | コーチングマッチング`,
    description,
    alternates: {
      canonical: `/coaching/${slug}`,
    },
    openGraph: {
      title: `${coach.displayName} | ピックルボールコーチング`,
      description,
    },
  };
}

const AVAILABILITY_COLORS: Record<string, string> = {
  open: "bg-green-100 text-green-800",
  limited: "bg-yellow-100 text-yellow-800",
  closed: "bg-gray-100 text-gray-500",
};

export default async function CoachDetailPage({ params }: Props) {
  const { slug } = await params;
  const coach = getCoachBySlug(slug);

  if (!coach) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="mb-6">
        <Link
          href="/coaching"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          ← コーチ一覧に戻る
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* プロフィールカード */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <Image
                src={coach.photoUrl ?? "/images/brand/default-avatar.png"}
                alt={coach.displayName}
                width={96}
                height={96}
                className="h-24 w-24 rounded-full object-cover"
              />
              <CardTitle className="mt-4 text-xl">{coach.displayName}</CardTitle>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${AVAILABILITY_COLORS[coach.availability]}`}
                >
                  {AVAILABILITY_LABELS[coach.availability]}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {coach.duprRating && (
                <>
                  <div className="text-sm">
                    <span className="text-muted-foreground">DUPR: </span>
                    <span className="font-semibold">{coach.duprRating.toFixed(3)}</span>
                  </div>
                  <Separator />
                </>
              )}
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">コーチング形式</p>
                <div className="flex flex-wrap gap-1.5">
                  {coach.coachingTypes.map((type) => (
                    <Badge key={type} variant="outline">
                      {COACHING_TYPE_LABELS[type]}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">対象レベル</p>
                <div className="flex flex-wrap gap-1.5">
                  {coach.targetLevels.map((level) => (
                    <Badge key={level} variant="secondary">
                      {TARGET_LEVEL_LABELS[level]}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">対応エリア</p>
                <div className="flex flex-wrap gap-1.5">
                  {coach.areas.map((area) => (
                    <Badge key={area} variant="secondary">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">料金目安</p>
                <p className="font-medium">{coach.priceRange}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* メインコンテンツ */}
        <div className="space-y-6 md:col-span-2">
          {/* 実績 */}
          {coach.achievements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>主な実績</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {coach.achievements.map((achievement, i) => (
                    <li key={i}>{achievement}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* コーチング内容 */}
          <Card>
            <CardHeader>
              <CardTitle>コーチング内容</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {coach.description}
              </p>
            </CardContent>
          </Card>

          {/* お問い合わせ */}
          <Card>
            <CardHeader>
              <CardTitle>お問い合わせ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                コーチングの詳細・日程・料金については、下記から直接コーチにお問い合わせください。お問い合わせ時に「ピクラを見ました」とお伝えいただくと、レッスン料が5%OFFになります。
              </p>
              <Button asChild>
                <a
                  href={coach.contactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {CONTACT_METHOD_LABELS[coach.contactMethod]}で問い合わせる
                </a>
              </Button>
              <p className="text-xs text-muted-foreground">
                ※ コーチングの契約・決済はコーチと受講者の間で直接行ってください。5%割引分はピクラがコーチに還元しますので、コーチの収入は変わりません。
              </p>
            </CardContent>
          </Card>

          {/* 選手ページリンク */}
          {coach.playerSlug && (
            <div className="text-sm">
              <Link
                href={`/players/${encodeURIComponent(coach.playerSlug)}`}
                className="text-primary hover:underline"
              >
                {coach.displayName}のランキング・戦績を見る →
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
