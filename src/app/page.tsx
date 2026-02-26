import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layouts/header";
import { Footer } from "@/components/layouts/footer";
import { WebsiteJsonLd } from "@/components/features/seo/json-ld";
import { getArticleList } from "@/lib/microcms/queries";
import { getTopRankingsPreview, getUniquePlayerCount } from "@/lib/ranking/data";
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

const mockEvents = [
  {
    id: "1",
    title: "東京オープン 2026 春",
    date: "2026-04-15",
    location: "東京都江東区",
    level: "中級〜上級",
  },
  {
    id: "2",
    title: "初心者歓迎！大阪ピックルボール体験会",
    date: "2026-03-20",
    location: "大阪府大阪市",
    level: "初心者",
  },
  {
    id: "3",
    title: "名古屋ミックスダブルス大会",
    date: "2026-04-05",
    location: "愛知県名古屋市",
    level: "中級",
  },
];

export default async function HomePage() {
  let articles: Pick<Article, "id" | "title" | "slug" | "category" | "publishedAt">[];
  try {
    const response = await getArticleList({ limit: 3 });
    articles = response.contents.length > 0 ? response.contents : fallbackArticles;
  } catch {
    articles = fallbackArticles;
  }

  return (
    <>
      <WebsiteJsonLd />
      <Header />
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-20 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              日本最大の
              <br />
              ピックルボールプラットフォーム
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              最新ニュース、ランキング、イベント情報、ペア募集など、
              ピックルボールに関するすべてがここに。
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/login">無料で始める</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/articles">記事を読む</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Latest Articles */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold">最新記事</h2>
              <Button asChild variant="ghost">
                <Link href="/articles">すべて見る</Link>
              </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <Card key={article.id}>
                  <CardHeader>
                    <div className="mb-2">
                      <Badge variant="secondary">
                        {categoryLabels[article.category] ?? article.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">
                      <Link
                        href={`/articles/${article.slug}`}
                        className="hover:underline"
                      >
                        {article.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(article.publishedAt)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Rankings Preview */}
        <section className="bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">JPA公式ランキング</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {getUniquePlayerCount()}名の選手が登録 / 男子ダブルス 一般
                </p>
              </div>
              <Button asChild variant="ghost">
                <Link href="/rankings">すべて見る</Link>
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                        <th className="w-16 px-6 py-3 text-center">順位</th>
                        <th className="px-6 py-3">選手名</th>
                        <th className="px-6 py-3 text-right">ポイント</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getTopRankingsPreview().map((entry, i) => (
                        <tr key={`${entry.playerName}-${i}`} className="border-b last:border-0">
                          <td className="px-6 py-4 text-center">
                            {entry.rank <= 3 ? (
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                {entry.rank}
                              </span>
                            ) : (
                              <span className="font-bold text-muted-foreground">{entry.rank}</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <Link
                              href={`/players/${encodeURIComponent(entry.playerName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[()（）]/g, ""))}`}
                              className="font-medium hover:text-primary hover:underline"
                            >
                              {entry.playerName}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-semibold">{entry.points.toLocaleString()}</span>
                            <span className="ml-1 text-xs text-muted-foreground">pt</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Events Preview */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold">注目のイベント</h2>
              <Button asChild variant="ghost">
                <Link href="/events">すべて見る</Link>
              </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {mockEvents.map((event) => (
                <Card key={event.id}>
                  <CardHeader>
                    <div className="mb-2">
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
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {event.date} / {event.location}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary py-20 text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold">
              ピックルボールを始めよう
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              ランキング確認、イベント参加、ペア探し。
              すべて無料で利用できます。
            </p>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="mt-8"
            >
              <Link href="/login">無料で始める</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
