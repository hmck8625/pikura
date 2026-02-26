import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "記事一覧",
  description:
    "ピックルボールに関する最新記事、ルール解説、戦術ガイド、大会レポートなど。",
};

const mockArticles = [
  {
    id: "1",
    title: "ピックルボールとは？初心者向け完全ガイド",
    slug: "what-is-pickleball",
    category: "入門",
    publishedAt: "2026-02-20",
    description: "ピックルボールの基本的な概要や魅力を初心者向けに解説します。",
  },
  {
    id: "2",
    title: "2026年注目の国内大会スケジュール",
    slug: "2026-tournament-schedule",
    category: "ニュース",
    publishedAt: "2026-02-18",
    description: "2026年に開催予定の主要なピックルボール大会をまとめました。",
  },
  {
    id: "3",
    title: "ピックルボールの基本ルールを徹底解説",
    slug: "pickleball-rules",
    category: "ルール",
    publishedAt: "2026-02-15",
    description: "スコアリング、サーブ、キッチンルールなど基本ルールを詳しく解説。",
  },
  {
    id: "4",
    title: "初心者が最初に覚えるべき5つのショット",
    slug: "beginner-shots",
    category: "戦術",
    publishedAt: "2026-02-12",
    description: "ピックルボールで最初に習得すべき基本ショットを紹介します。",
  },
];

export default function ArticlesPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">記事一覧</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {mockArticles.map((article) => (
          <Card key={article.id}>
            <CardHeader>
              <div className="mb-2">
                <Badge variant="secondary">{article.category}</Badge>
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
                {article.publishedAt}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
