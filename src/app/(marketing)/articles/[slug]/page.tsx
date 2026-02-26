import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Props = {
  params: Promise<{ slug: string }>;
};

const mockArticles: Record<
  string,
  { title: string; category: string; content: string; publishedAt: string }
> = {
  "what-is-pickleball": {
    title: "ピックルボールとは？初心者向け完全ガイド",
    category: "入門",
    content:
      "ピックルボールは、テニス、バドミントン、卓球の要素を組み合わせたラケットスポーツです。1965年にアメリカで生まれ、現在世界中で急速に普及しています。日本でも近年、競技人口が増加しており、幅広い年齢層に楽しまれています。",
    publishedAt: "2026-02-20",
  },
  "pickleball-rules": {
    title: "ピックルボールの基本ルールを徹底解説",
    category: "ルール",
    content:
      "ピックルボールのルールは比較的シンプルです。コートはバドミントンコートと同じサイズで、ネット越しにパドルでボールを打ち合います。サーブは対角線上に打ち、キッチン（ノーボレーゾーン）内ではボレーが禁止されています。",
    publishedAt: "2026-02-15",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = mockArticles[slug];
  if (!article) return { title: "記事が見つかりません" };

  return {
    title: article.title,
    description: article.content.slice(0, 120),
    openGraph: {
      title: article.title,
      description: article.content.slice(0, 120),
      images: [`/api/og?type=article&slug=${slug}`],
    },
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = mockArticles[slug];

  if (!article) {
    notFound();
  }

  return (
    <article className="container mx-auto max-w-3xl px-4 py-12">
      <div className="mb-4">
        <Badge variant="secondary">{article.category}</Badge>
      </div>
      <h1 className="mb-4 text-3xl font-bold">{article.title}</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        {article.publishedAt}
      </p>
      <Separator className="mb-8" />
      <div className="prose max-w-none">
        <p>{article.content}</p>
      </div>
    </article>
  );
}
