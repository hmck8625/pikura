import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArticleThumbnail } from "@/components/features/articles/article-thumbnail";
import { getArticleList } from "@/lib/microcms/queries";

export const revalidate = 3600;

const ARTICLES_PER_PAGE = 18;

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

function buildHref(params: { category?: string; page?: number }): string {
  const searchParams = new URLSearchParams();
  if (params.category && params.category !== "all") {
    searchParams.set("category", params.category);
  }
  if (params.page && params.page > 1) {
    searchParams.set("page", String(params.page));
  }
  const qs = searchParams.toString();
  return qs ? `/articles?${qs}` : "/articles";
}

type Props = {
  searchParams: Promise<{ category?: string; page?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const currentPage = Math.max(1, Number(params.page) || 1);

  return {
    title: "記事一覧",
    description:
      "ピックルボールに関する最新記事、ルール解説、戦術ガイド、大会レポートなど。初心者から上級者まで役立つ情報を掲載。",
    alternates: {
      canonical: currentPage === 1 ? "/articles" : `/articles?page=${currentPage}`,
    },
  };
}

export default async function ArticlesPage({ searchParams }: Props) {
  const params = await searchParams;
  const selectedCategory = params.category ?? "all";
  const currentPage = Math.max(1, Number(params.page) || 1);
  const offset = (currentPage - 1) * ARTICLES_PER_PAGE;

  const response = await getArticleList({
    limit: ARTICLES_PER_PAGE,
    offset,
    category: selectedCategory === "all" ? undefined : selectedCategory,
  });

  const articles = response.contents;
  const totalCount = response.totalCount;
  const totalPages = Math.ceil(totalCount / ARTICLES_PER_PAGE);

  const categories = ["all", ...Object.keys(categoryLabels)] as const;

  return (
    <>
      {currentPage > 1 && (
        <link
          rel="prev"
          href={buildHref({ category: selectedCategory, page: currentPage - 1 })}
        />
      )}
      {currentPage < totalPages && (
        <link
          rel="next"
          href={buildHref({ category: selectedCategory, page: currentPage + 1 })}
        />
      )}
      <div className="container mx-auto px-4 py-12">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">記事一覧</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            ピックルボールに関する入門ガイド、ルール解説、ギアレビュー、大会情報など
          </p>
        </div>

        {/* カテゴリフィルタ */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((cat) => {
            const isActive = cat === selectedCategory;
            const label = cat === "all" ? "すべて" : categoryLabels[cat];
            return (
              <Button
                key={cat}
                asChild
                variant={isActive ? "default" : "outline"}
                size="sm"
              >
                <Link href={buildHref({ category: cat })}>
                  {label}
                </Link>
              </Button>
            );
          })}
        </div>

        {/* 記事件数 + ページ情報 */}
        <p className="mb-4 text-sm text-muted-foreground">
          {totalCount}件の記事
          {totalPages > 1 && `（${currentPage} / ${totalPages}ページ）`}
        </p>

        {/* 記事一覧 */}
        {articles.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {articles.map((article) => (
              <Card key={article.id} className="overflow-hidden transition-colors hover:bg-muted/50">
                <Link href={`/articles/${article.slug}`}>
                  <div className="relative aspect-video">
                    <ArticleThumbnail
                      src={article.thumbnail?.url ?? `/images/articles/${article.slug}.png`}
                      alt={article.title}
                      category={article.category}
                    />
                  </div>
                </Link>
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
                  {article.description && (
                    <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
                      {article.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDate(article.publishedAt)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border py-12 text-center text-muted-foreground">
            <p>この条件に一致する記事はまだありません。</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/articles">すべての記事を見る</Link>
            </Button>
          </div>
        )}

        {/* ページネーション */}
        {totalPages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-2" aria-label="ページナビゲーション">
            {/* 前へ */}
            {currentPage > 1 ? (
              <Button asChild variant="outline" size="sm">
                <Link href={buildHref({ category: selectedCategory, page: currentPage - 1 })}>
                  ← 前へ
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                ← 前へ
              </Button>
            )}

            {/* ページ番号 */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // 表示するページ番号を制限（現在ページの前後2ページ + 先頭/末尾）
                const showPage =
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 2;

                if (!showPage) {
                  // 省略記号（直前のページが表示されている場合のみ）
                  const prevShown =
                    page - 1 === 1 ||
                    page - 1 === totalPages ||
                    Math.abs(page - 1 - currentPage) <= 2;
                  if (prevShown) {
                    return (
                      <span key={`ellipsis-${page}`} className="px-1 text-muted-foreground">
                        …
                      </span>
                    );
                  }
                  return null;
                }

                return (
                  <Button
                    key={page}
                    asChild={page !== currentPage}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    className="min-w-[36px]"
                  >
                    {page === currentPage ? (
                      <span>{page}</span>
                    ) : (
                      <Link href={buildHref({ category: selectedCategory, page })}>
                        {page}
                      </Link>
                    )}
                  </Button>
                );
              })}
            </div>

            {/* 次へ */}
            {currentPage < totalPages ? (
              <Button asChild variant="outline" size="sm">
                <Link href={buildHref({ category: selectedCategory, page: currentPage + 1 })}>
                  次へ →
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                次へ →
              </Button>
            )}
          </nav>
        )}
      </div>
    </>
  );
}
