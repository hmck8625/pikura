import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layouts/header";
import { Footer } from "@/components/layouts/footer";
import { RankingCategoryFilter } from "@/components/features/ranking/ranking-category-filter";
import { getRankings, getUniquePlayerCount, getTotalEntries } from "@/lib/ranking/data";
import { CATEGORY_LABELS, AGE_GROUP_LABELS } from "@/lib/ranking/types";

export const metadata: Metadata = {
  title: "JPA公式ランキング",
  description:
    "日本ピックルボール協会（JPA）公式ランキング。男子/女子シングルス・ダブルス・混合ダブルス、年齢区分別に検索・閲覧できます。",
  alternates: {
    canonical: "/rankings",
  },
  openGraph: {
    title: "JPA公式ランキング | ピクラ",
    description:
      "日本ピックルボール協会（JPA）公式ランキング。カテゴリ別・年齢区分別に検索・閲覧できます。",
    images: ["/api/og?type=rankings"],
  },
};

type Props = {
  searchParams: Promise<{ category?: string; age?: string }>;
};

export default async function RankingsPage({ searchParams }: Props) {
  const params = await searchParams;
  const category = params.category ?? "男子シングルス";
  const ageGroup = params.age ?? "19+";

  const rankings = getRankings(category, ageGroup);
  const uniquePlayers = getUniquePlayerCount();
  const totalEntries = getTotalEntries();

  const categoryLabel = CATEGORY_LABELS[category] ?? category;
  const ageLabel = AGE_GROUP_LABELS[ageGroup] ?? ageGroup;

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">JPA公式ランキング</h1>
          <p className="mt-2 text-muted-foreground">
            日本ピックルボール協会（JPA）公式ランキング / 2026年1月
          </p>
          <div className="mt-2 flex gap-3 text-sm text-muted-foreground">
            <span>{uniquePlayers}名の選手</span>
            <span>|</span>
            <span>{totalEntries}エントリー</span>
            <span>|</span>
            <span>15カテゴリ</span>
          </div>
        </div>

        {/* フィルター */}
        <div className="mb-8">
          <Suspense fallback={null}>
            <RankingCategoryFilter />
          </Suspense>
        </div>

        {/* 現在の表示 */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold">
            {categoryLabel} / {ageLabel}
          </h2>
          <p className="text-sm text-muted-foreground">
            {rankings.length}名がランクイン
          </p>
        </div>

        {/* ランキングテーブル */}
        {rankings.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                      <th className="w-16 px-4 py-3 text-center">順位</th>
                      <th className="px-4 py-3">選手名</th>
                      <th className="w-24 px-4 py-3 text-right">ポイント</th>
                      <th className="hidden w-20 px-4 py-3 text-center sm:table-cell" />
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map((entry, i) => {
                      const slug = entry.playerName
                        .trim()
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[()（）]/g, "");
                      return (
                        <tr
                          key={`${entry.playerName}-${i}`}
                          className="border-b last:border-0 transition-colors hover:bg-muted/50"
                        >
                          <td className="px-4 py-4 text-center">
                            {entry.rank <= 3 ? (
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                                {entry.rank}
                              </span>
                            ) : (
                              <span className="text-sm font-bold text-muted-foreground">
                                {entry.rank}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <Link
                              href={`/players/${encodeURIComponent(slug)}`}
                              className="font-medium hover:text-primary hover:underline"
                            >
                              {entry.playerName}
                            </Link>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="font-semibold">
                              {entry.points.toLocaleString()}
                            </span>
                            <span className="ml-1 text-xs text-muted-foreground">
                              pt
                            </span>
                          </td>
                          <td className="hidden px-4 py-4 text-center sm:table-cell">
                            <Link href={`/players/${encodeURIComponent(slug)}`}>
                              <Button variant="ghost" size="sm">
                                詳細
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>このカテゴリ・年齢区分のランキングデータはまだありません。</p>
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <div className="mt-12 rounded-lg border bg-muted/30 p-8 text-center">
          <h3 className="text-lg font-bold">
            あなたもランキングに載りませんか？
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            JPA公式大会に出場した結果をもとに、あなたの選手ページとランキングが表示されます。
          </p>
          <Badge variant="secondary" className="mt-4">
            データ出典: 日本ピックルボール協会（JPA）
          </Badge>
        </div>

        {/* 記事への内部リンク */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Link
            href="/articles"
            className="rounded-lg border p-4 text-center transition-colors hover:bg-muted/50"
          >
            <p className="font-medium">ピックルボール入門</p>
            <p className="mt-1 text-xs text-muted-foreground">
              初心者向けガイド記事
            </p>
          </Link>
          <Link
            href="/events"
            className="rounded-lg border p-4 text-center transition-colors hover:bg-muted/50"
          >
            <p className="font-medium">大会・イベント</p>
            <p className="mt-1 text-xs text-muted-foreground">
              ランキング対象大会情報
            </p>
          </Link>
          <Link
            href="/pairs"
            className="rounded-lg border p-4 text-center transition-colors hover:bg-muted/50"
          >
            <p className="font-medium">ペア募集</p>
            <p className="mt-1 text-xs text-muted-foreground">
              ダブルスのパートナーを探す
            </p>
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
