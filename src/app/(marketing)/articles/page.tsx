import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getArticleList } from "@/lib/microcms/queries";
import type { Article } from "@/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "記事一覧",
  description:
    "ピックルボールに関する最新記事、ルール解説、戦術ガイド、大会レポートなど。",
};

const fallbackArticles: Article[] = [
  {
    id: "1",
    title: "ピックルボールとは？初心者向け完全ガイド",
    slug: "what-is-pickleball",
    category: "beginner",
    description: "ピックルボールの基本的な概要や魅力を初心者向けに解説します。",
    content: "",
    publishedAt: "2026-02-20T00:00:00.000Z",
    createdAt: "2026-02-20T00:00:00.000Z",
    updatedAt: "2026-02-20T00:00:00.000Z",
  },
  {
    id: "2",
    title: "2026年注目の国内大会スケジュール",
    slug: "2026-tournament-schedule",
    category: "events",
    description: "2026年に開催予定の主要なピックルボール大会をまとめました。",
    content: "",
    publishedAt: "2026-02-18T00:00:00.000Z",
    createdAt: "2026-02-18T00:00:00.000Z",
    updatedAt: "2026-02-18T00:00:00.000Z",
  },
  {
    id: "3",
    title: "ピックルボールの基本ルールを徹底解説",
    slug: "pickleball-rules",
    category: "rules",
    description:
      "スコアリング、サーブ、キッチンルールなど基本ルールを詳しく解説。",
    content: "",
    publishedAt: "2026-02-15T00:00:00.000Z",
    createdAt: "2026-02-15T00:00:00.000Z",
    updatedAt: "2026-02-15T00:00:00.000Z",
  },
  {
    id: "4",
    title: "初心者が最初に覚えるべき5つのショット",
    slug: "beginner-shots",
    category: "tips",
    description: "ピックルボールで最初に習得すべき基本ショットを紹介します。",
    content: "",
    publishedAt: "2026-02-12T00:00:00.000Z",
    createdAt: "2026-02-12T00:00:00.000Z",
    updatedAt: "2026-02-12T00:00:00.000Z",
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

export default async function ArticlesPage() {
  let articles: Article[];

  try {
    const response = await getArticleList({ limit: 20 });
    articles = response.contents.length > 0 ? response.contents : fallbackArticles;
  } catch {
    articles = fallbackArticles;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">記事一覧</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <Card key={article.id} className="overflow-hidden">
            {article.thumbnail && (
              <Link href={`/articles/${article.slug}`}>
                <div className="relative aspect-video">
                  <Image
                    src={article.thumbnail.url}
                    alt={article.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              </Link>
            )}
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
              <p className="mb-2 text-sm text-muted-foreground">
                {article.description}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(article.publishedAt)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
