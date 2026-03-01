import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/layouts/header";
import { Footer } from "@/components/layouts/footer";
import { WebsiteJsonLd } from "@/components/features/seo/json-ld";
import { getArticleList } from "@/lib/microcms/queries";
import { getTopRankingsPreview, getUniquePlayerCount } from "@/lib/ranking/data";
import { getUpcomingEvents, getEvents } from "@/lib/events/data";
import { getCoachCount, getActiveCoachCount } from "@/lib/coaching/data";
import { EVENT_CATEGORY_LABELS, EVENT_SOURCE_LABELS, EVENT_LEVEL_LABELS } from "@/lib/events/types";
import type { Article } from "@/types";
import {
  CalendarDays,
  Trophy,
  BookOpen,
  Users,
  ShoppingBag,
  MapPin,
  ArrowRight,
  GraduationCap,
  DollarSign,
  Star,
  Shirt,
} from "lucide-react";

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
  players: "選手",
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
  const totalEvents = getEvents().length;
  const coachCount = getCoachCount();
  const activeCoachCount = getActiveCoachCount();

  return (
    <>
      <WebsiteJsonLd />
      <Header />
      <main>
        {/* 1. Hero Section */}
        <section className="relative overflow-hidden bg-black py-20 md:py-32">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover opacity-40"
            aria-hidden="true"
          >
            <source src="/videos/fv-hero.mp4" type="video/mp4" />
          </video>
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/60"
            aria-hidden="true"
          />
          <div className="container relative mx-auto px-4 text-center">
            <Badge className="mb-6 border-white/30 bg-white/15 text-sm text-white backdrop-blur-sm">
              日本最大のピックルボール情報サイト
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl">
              ピックルボールするなら、
              <br />
              ピクラ。
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-white/80 drop-shadow-md sm:text-lg md:text-xl">
              大会情報、ランキング、コーチング、入門ガイド。
              <br className="hidden sm:block" />
              日本のピックルボール情報が、ここに集まる。
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4">
              <Button asChild size="lg" className="w-full text-base sm:w-auto">
                <Link href="/events">
                  <CalendarDays className="mr-2 h-5 w-5" />
                  イベントを探す
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full border-white/40 text-base text-white hover:bg-white/10 sm:w-auto">
                <Link href="/articles">
                  <BookOpen className="mr-2 h-5 w-5" />
                  記事を読む
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* 2. Stats Section */}
        <section className="border-y bg-muted/30 py-12 sm:py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                </div>
                <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                  {totalEvents}
                  <span className="text-lg font-normal text-muted-foreground sm:text-xl">+</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">イベント</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2">
                  <Users className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                </div>
                <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                  {playerCount}
                  <span className="text-lg font-normal text-muted-foreground sm:text-xl">名</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">選手</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                </div>
                <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                  20
                  <span className="text-lg font-normal text-muted-foreground sm:text-xl">+</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">記事</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Events Section */}
        <section className="py-14 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-8 sm:mb-10">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold sm:text-3xl">
                  全国{totalEvents}件以上のイベントを、まとめて検索
                </h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                JPA公式大会からテニスベアの交流会まで。エリア・レベル・日程で絞り込めます。
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {upcomingEvents.map((event) => (
                <Card key={event.id} className="transition-colors hover:bg-muted/50">
                  <CardContent className="p-5">
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                        {EVENT_SOURCE_LABELS[event.source]}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {EVENT_CATEGORY_LABELS[event.category]}
                      </Badge>
                      {event.prefecture && (
                        <Badge variant="secondary" className="text-xs">{event.prefecture}</Badge>
                      )}
                      {event.level !== "unknown" && (
                        <Badge variant="secondary" className="text-xs">
                          {EVENT_LEVEL_LABELS[event.level]}
                        </Badge>
                      )}
                    </div>
                    <h3 className="mb-2 text-sm font-semibold leading-snug sm:text-base">
                      <Link href={`/events/${event.id}`} className="hover:text-primary hover:underline">
                        {event.title}
                      </Link>
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>{formatEventDate(event.eventDate)}</span>
                      {event.location && (
                        <>
                          <Separator orientation="vertical" className="mx-1 h-3" />
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="truncate">{event.location}</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Button asChild variant="outline" size="lg">
                <Link href="/events">
                  すべてのイベントを見る
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* 4. Rankings Section */}
        <section className="bg-muted/20 py-14 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-8 sm:mb-10">
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold sm:text-3xl">
                  JPA公式ランキングを、いつでも確認
                </h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                {playerCount}名の選手データを無料で閲覧。男子ダブルス 一般のトップ5を表示中。
              </p>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-xs font-medium text-muted-foreground sm:text-sm">
                        <th className="w-14 px-4 py-3 text-center sm:w-16 sm:px-6">順位</th>
                        <th className="px-4 py-3 sm:px-6">選手名</th>
                        <th className="px-4 py-3 text-right sm:px-6">ポイント</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getTopRankingsPreview().map((entry, i) => (
                        <tr key={`${entry.playerName}-${i}`} className="border-b last:border-0">
                          <td className="px-4 py-3.5 text-center sm:px-6 sm:py-4">
                            {entry.rank <= 3 ? (
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                {entry.rank}
                              </span>
                            ) : (
                              <span className="text-sm font-bold text-muted-foreground">{entry.rank}</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 sm:px-6 sm:py-4">
                            <Link
                              href={`/players/${encodeURIComponent(entry.playerName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[()（）]/g, ""))}`}
                              className="text-sm font-medium hover:text-primary hover:underline sm:text-base"
                            >
                              {entry.playerName}
                            </Link>
                          </td>
                          <td className="px-4 py-3.5 text-right sm:px-6 sm:py-4">
                            <span className="text-sm font-semibold sm:text-base">
                              {entry.points.toLocaleString()}
                            </span>
                            <span className="ml-1 text-xs text-muted-foreground">pt</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            <div className="mt-8 text-center">
              <Button asChild variant="outline" size="lg">
                <Link href="/rankings">
                  全カテゴリのランキングを見る
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* 5. Coaching Section */}
        <section className="py-14 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-8 sm:mb-10">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold sm:text-3xl">
                  プロから直接学べる。手数料ゼロ。
                </h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                ピクラのコーチングは仲介手数料なし。コーチと直接やり取りして、あなたに合ったレッスンを見つけましょう。
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
              <Card>
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold">実績あるコーチ</h3>
                  <p className="text-sm text-muted-foreground">
                    JPA公式大会入賞者やDUPR高レーティングのプレーヤーが直接指導します。
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold">手数料ゼロ</h3>
                  <p className="text-sm text-muted-foreground">
                    ピクラはプラットフォーム手数料を一切いただきません。レッスン料はすべてコーチへ。
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold">個人もグループも</h3>
                  <p className="text-sm text-muted-foreground">
                    マンツーマンの個人レッスンから、仲間と一緒のグループレッスン、クリニックまで対応。
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="mt-8 text-center">
              <Button asChild variant="outline" size="lg">
                <Link href="/coaching">
                  コーチを探す
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* 6. Articles Section */}
        <section className="bg-muted/30 py-14 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-8 sm:mb-10">
              <div className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold sm:text-3xl">
                  ルールも戦術も、読めばわかる
                </h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                初心者ガイドから上級者向け戦術まで。ピックルボールの知識を深めましょう。
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {articles.map((article) => (
                <Card key={article.id} className="transition-colors hover:bg-muted/50">
                  <CardContent className="p-5">
                    <div className="mb-3">
                      <Badge variant="secondary" className="text-xs">
                        {categoryLabels[article.category] ?? article.category}
                      </Badge>
                    </div>
                    <h3 className="mb-2 text-sm font-semibold leading-snug sm:text-base">
                      <Link href={`/articles/${article.slug}`} className="hover:text-primary hover:underline">
                        {article.title}
                      </Link>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(article.publishedAt)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Button asChild variant="outline" size="lg">
                <Link href="/articles">
                  すべての記事を見る
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* 7. Shop Banner Section */}
        <section className="py-14 sm:py-20">
          <div className="container mx-auto px-4">
            <Card className="overflow-hidden">
              <CardContent className="flex flex-col items-center gap-6 p-8 sm:flex-row sm:p-10">
                <div className="flex-1 text-center sm:text-left">
                  <div className="mb-3 flex items-center justify-center gap-2 sm:justify-start">
                    <Shirt className="h-6 w-6 text-primary" />
                    <Badge variant="secondary">pikura shop</Badge>
                  </div>
                  <h2 className="text-2xl font-bold sm:text-3xl">
                    コートで着たくなる一着
                  </h2>
                  <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                    「STAY OUT OF THE KITCHEN!」「IT&apos;S MY PARTNER&apos;S FAULT.」
                    <br className="hidden sm:block" />
                    ピックルボーラーなら笑える、25種類のオリジナルTシャツ。
                  </p>
                  <div className="mt-6">
                    <Button asChild size="lg">
                      <Link href="/shop">
                        <ShoppingBag className="mr-2 h-5 w-5" />
                        ショップを見る
                      </Link>
                    </Button>
                  </div>
                </div>
                <div className="flex h-40 w-full items-center justify-center rounded-lg bg-muted/50 sm:h-48 sm:w-64 sm:flex-shrink-0">
                  <div className="text-center">
                    <Shirt className="mx-auto h-16 w-16 text-muted-foreground/40" />
                    <p className="mt-2 text-xs text-muted-foreground/60">25 designs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 8. Final CTA Section */}
        <section className="bg-primary py-16 text-primary-foreground sm:py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">
              ピックルボールするなら、ピクラ。
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-primary-foreground/80 sm:text-base md:text-lg">
              大会情報、ランキング、コーチング、入門ガイド。
              <br className="hidden sm:block" />
              日本のピックルボール情報が、ここに集まる。
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="w-full text-base sm:w-auto"
              >
                <Link href="/events">
                  <CalendarDays className="mr-2 h-5 w-5" />
                  イベントを探す
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto"
              >
                <Link href="/articles">
                  <BookOpen className="mr-2 h-5 w-5" />
                  記事を読む
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
