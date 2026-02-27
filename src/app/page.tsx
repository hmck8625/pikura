import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layouts/header";
import { Footer } from "@/components/layouts/footer";
import { WebsiteJsonLd } from "@/components/features/seo/json-ld";
import { getArticleList } from "@/lib/microcms/queries";
import { getTopRankingsPreview, getUniquePlayerCount } from "@/lib/ranking/data";
import { getUpcomingEvents, EVENT_CATEGORY_LABELS } from "@/lib/events/data";
import type { Article } from "@/types";

export const revalidate = 3600;

const fallbackArticles: Pick<Article, "id" | "title" | "slug" | "category" | "publishedAt">[] = [
  {
    id: "1",
    title: "ピックルボールとは？初心者向け完全ガイド",
    slug: "what-is-pickleball",
    category: "beginner",
    publishedAt: "2026-02-20T00:00:00.000Z",
  },
  {
    id: "2",
    title: "2026年注目の国内大会スケジュール",
    slug: "2026-tournament-schedule",
    category: "events",
    publishedAt: "2026-02-18T00:00:00.000Z",
  },
  {
    id: "3",
    title: "ピックルボールの基本ルールを徹底解説",
    slug: "pickleball-rules",
    category: "rules",
    publishedAt: "2026-02-15T00:00:00.000Z",
  },
];

const categoryLabels: Record<string, string> = {
  beginner: "入門",
  rules: "ルール",
  gear: "ギア",
  events: "大会",
  tips: "戦術",
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatEventDate(dateString: string | null): string {
  if (!dateString) return "日程未定";
  return new Date(dateString).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function HomePage() {
  let articles: Pick<Article, "id" | "title" | "slug" | "category" | "publishedAt">[];
  try {
    const response = await getArticleList({ limit: 3 });
    articles = response.contents.length > 0 ? response.contents : fallbackArticles;
  } catch {
    articles = fallbackArticles;
  }

  const playerCount = getUniquePlayerCount();
  const upcomingEvents = getUpcomingEvents(3);

  return (
    <>
      <WebsiteJsonLd />
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 to-background py-16 md:py-28">
          <div
            className="absolute inset-0 bg-[url('/images/hero/hero-pickleball.png')] bg-cover bg-center opacity-[0.07]"
            aria-hidden="true"
          />
          <div className="container relative mx-auto px-4 text-center">
            <Badge variant="secondary" className="mb-4">
              JPA公式ランキング公開中
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-6xl">
              ピックルボールの
              <br className="hidden sm:block" />
              すべてが、ここに。
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:mt-6 sm:text-lg">
              JPA公式ランキング・大会情報・入門ガイド。
              <br className="hidden sm:block" />
              {playerCount}名の選手データを無料で閲覧できます。
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:mt-8 sm:flex-row sm:gap-4">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/rankings">ランキングを見る</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link href="/articles">記事を読む</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Rankings Preview */}
        <section className="bg-muted/30 py-12 sm:py-16">
          <div className="container mx-auto px-4">
            <div className="mb-6 flex items-center justify-between sm:mb-8">
              <div>
                <h2 className="text-xl font-bold sm:text-2xl">JPA公式ランキング</h2>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  {playerCount}名の選手が登録 / 男子ダブルス 一般
                </p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/rankings">すべて見る</Link>
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-xs font-medium text-muted-foreground sm:text-sm">
                        <th className="w-12 px-3 py-3 text-center sm:w-16 sm:px-6">順位</th>
                        <th className="px-3 py-3 sm:px-6">選手名</th>
                        <th className="px-3 py-3 text-right sm:px-6">ポイント</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getTopRankingsPreview().map((entry, i) => (
                        <tr key={`${entry.playerName}-${i}`} className="border-b last:border-0">
                          <td className="px-3 py-3 text-center sm:px-6 sm:py-4">
                            {entry.rank <= 3 ? (
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground sm:h-7 sm:w-7">
                                {entry.rank}
                              </span>
                            ) : (
                              <span className="text-sm font-bold text-muted-foreground">{entry.rank}</span>
                            )}
                          </td>
                          <td className="px-3 py-3 sm:px-6 sm:py-4">
                            <Link
                              href={`/players/${encodeURIComponent(entry.playerName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[()（）]/g, ""))}`}
                              className="text-sm font-medium hover:text-primary hover:underline"
                            >
                              {entry.playerName}
                            </Link>
                          </td>
                          <td className="px-3 py-3 text-right sm:px-6 sm:py-4">
                            <span className="text-sm font-semibold">{entry.points.toLocaleString()}</span>
                            <span className="ml-1 text-xs text-muted-foreground">pt</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            <div className="mt-4 text-center">
              <Button asChild variant="outline">
                <Link href="/rankings">全カテゴリのランキングを見る</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Latest Articles */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4">
            <div className="mb-6 flex items-center justify-between sm:mb-8">
              <h2 className="text-xl font-bold sm:text-2xl">最新記事</h2>
              <Button asChild variant="ghost" size="sm">
                <Link href="/articles">すべて見る</Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {articles.map((article) => (
                <Card key={article.id} className="transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <div className="mb-2">
                      <Badge variant="secondary">
                        {categoryLabels[article.category] ?? article.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-base sm:text-lg">
                      <Link
                        href={`/articles/${article.slug}`}
                        className="hover:underline"
                      >
                        {article.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      {formatDate(article.publishedAt)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Events Preview */}
        <section className="border-t bg-muted/20 py-12 sm:py-16">
          <div className="container mx-auto px-4">
            <div className="mb-6 flex items-center justify-between sm:mb-8">
              <h2 className="text-xl font-bold sm:text-2xl">注目のイベント</h2>
              <Button asChild variant="ghost" size="sm">
                <Link href="/events">すべて見る</Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {upcomingEvents.map((event) => (
                <Card key={event.id} className="transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <div className="mb-2 flex flex-wrap gap-1">
                      <Badge variant="outline">
                        {EVENT_CATEGORY_LABELS[event.category]}
                      </Badge>
                      {event.prefecture && (
                        <Badge variant="secondary">{event.prefecture}</Badge>
                      )}
                    </div>
                    <CardTitle className="text-base sm:text-lg">
                      <Link
                        href={`/events/${event.id}`}
                        className="hover:underline"
                      >
                        {event.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      {formatEventDate(event.eventDate)}
                      {event.location ? ` / ${event.location}` : ""}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary py-16 text-primary-foreground sm:py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">
              ピックルボールを、もっと楽しく。
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-primary-foreground/80 sm:text-base">
              ランキング確認、大会情報、入門ガイド。
              日本のピックルボール情報はピクラでチェック。
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:mt-8 sm:flex-row sm:gap-4">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto"
              >
                <Link href="/rankings">ランキングを見る</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto"
              >
                <Link href="/articles">記事を読む</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
