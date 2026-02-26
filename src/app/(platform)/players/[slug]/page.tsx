import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layouts/header";
import { Footer } from "@/components/layouts/footer";
import { PlayerShareButtons } from "@/components/features/ranking/player-share-buttons";
import { PlayerJsonLd, BreadcrumbJsonLd } from "@/components/features/seo/json-ld";
import { getPlayerBySlug, getAllPlayerSlugs } from "@/lib/ranking/data";
import { CATEGORY_LABELS, AGE_GROUP_LABELS } from "@/lib/ranking/types";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllPlayerSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const player = getPlayerBySlug(decodeURIComponent(slug));
  if (!player) return { title: "選手が見つかりません" };

  const bestCatLabel = CATEGORY_LABELS[player.bestCategory] ?? player.bestCategory;
  const description = `${player.name}のJPA公式ピックルボールランキング。${bestCatLabel} ${player.bestRank}位 / 合計${player.totalPoints}pt`;

  return {
    title: `${player.name} | JPA公式ランキング・戦績`,
    description,
    alternates: {
      canonical: `/players/${encodeURIComponent(slug)}`,
    },
    openGraph: {
      title: `${player.name} | ピックルボールランキング`,
      description,
      images: [`/api/og?type=player&name=${encodeURIComponent(player.name)}&rank=${player.bestRank}&points=${player.totalPoints}`],
    },
  };
}

export default async function PlayerPage({ params }: Props) {
  const { slug } = await params;
  const player = getPlayerBySlug(decodeURIComponent(slug));

  if (!player) {
    notFound();
  }

  const bestCatLabel = CATEGORY_LABELS[player.bestCategory] ?? player.bestCategory;
  const bestAgeLabel = AGE_GROUP_LABELS[player.bestAgeGroup] ?? player.bestAgeGroup;

  // カテゴリ数
  const categoryCount = player.rankings.length;

  return (
    <>
      <PlayerJsonLd
        name={player.name}
        slug={player.slug}
        bestRank={player.bestRank}
        totalPoints={player.totalPoints}
        bestCategory={bestCatLabel}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "ホーム", url: "https://pikura.app" },
          { name: "ランキング", url: "https://pikura.app/rankings" },
          { name: player.name, url: `https://pikura.app/players/${encodeURIComponent(player.slug)}` },
        ]}
      />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-6">
          <Link
            href="/rankings"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            ← ランキング一覧に戻る
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* プロフィールカード */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <Image
                  src="/images/brand/default-avatar.png"
                  alt={player.name}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-full object-cover"
                />
                <CardTitle className="mt-4 text-xl">{player.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  JPA公式ランキング選手
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge>{bestCatLabel}</Badge>
                  <Badge variant="outline">{bestAgeLabel}</Badge>
                </div>
                <Separator />
                <div className="text-sm text-muted-foreground">
                  <p>
                    {categoryCount}つのカテゴリにランクイン
                  </p>
                  <p className="mt-1">2026年1月データ</p>
                </div>
                <Separator />
                {/* シェアボタン */}
                <PlayerShareButtons
                  playerName={player.name}
                  bestRank={player.bestRank}
                  bestCategory={bestCatLabel}
                  slug={player.slug}
                />
              </CardContent>
            </Card>
          </div>

          {/* メインコンテンツ */}
          <div className="space-y-6 md:col-span-2">
            {/* 統計カード */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-4xl font-bold text-primary">
                    {player.bestRank}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    最高順位
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-4xl font-bold">
                    {player.totalPoints.toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    合計ポイント
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-4xl font-bold">{categoryCount}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    ランクイン数
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* カテゴリ別ランキング */}
            <Card>
              <CardHeader>
                <CardTitle>カテゴリ別ランキング</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {player.rankings
                    .sort((a, b) => a.rank - b.rank)
                    .map((r, i) => {
                      const catLabel =
                        CATEGORY_LABELS[r.category] ?? r.category;
                      const ageLabel =
                        AGE_GROUP_LABELS[r.ageGroup] ?? r.ageGroup;
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg border p-4"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold">
                              {r.rank}
                            </span>
                            <div>
                              <p className="font-medium">{catLabel}</p>
                              <p className="text-sm text-muted-foreground">
                                {ageLabel}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {r.points.toLocaleString()}{" "}
                              <span className="text-xs text-muted-foreground">
                                pt
                              </span>
                            </p>
                            <Link
                              href={`/rankings?category=${encodeURIComponent(r.category)}&age=${encodeURIComponent(r.ageGroup)}`}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-1 h-auto p-0 text-xs text-muted-foreground hover:text-primary"
                              >
                                このカテゴリを見る →
                              </Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* ポイント推移（将来実装） */}
            <Card>
              <CardHeader>
                <CardTitle>ポイント推移</CardTitle>
              </CardHeader>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p className="text-sm">
                  2026年2月以降のデータが蓄積されると、ポイント推移グラフが表示されます。
                </p>
                <p className="mt-1 text-xs">
                  JPA公式ランキングは毎月更新されます
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
