import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/features/seo/json-ld";
import { getArticleBySlug, getAllArticleSlugs } from "@/lib/microcms/queries";
import type { Article } from "@/types";

export const revalidate = 3600;

type Props = {
  params: Promise<{ slug: string }>;
};

const fallbackArticles: Record<string, Article> = {
  "what-is-pickleball": {
    id: "1",
    title: "ピックルボールとは？初心者向け完全ガイド",
    slug: "what-is-pickleball",
    category: "beginner",
    description: "ピックルボールの基本的な概要や魅力を初心者向けに解説します。",
    content:
      "<p>ピックルボールは、テニス、バドミントン、卓球の要素を組み合わせたラケットスポーツです。1965年にアメリカで生まれ、現在世界中で急速に普及しています。日本でも近年、競技人口が増加しており、幅広い年齢層に楽しまれています。</p>",
    publishedAt: "2026-02-20T00:00:00.000Z",
    createdAt: "2026-02-20T00:00:00.000Z",
    updatedAt: "2026-02-20T00:00:00.000Z",
  },
  "pickleball-rules": {
    id: "3",
    title: "ピックルボールの基本ルールを徹底解説",
    slug: "pickleball-rules",
    category: "rules",
    description:
      "スコアリング、サーブ、キッチンルールなど基本ルールを詳しく解説。",
    content:
      "<p>ピックルボールのルールは比較的シンプルです。コートはバドミントンコートと同じサイズで、ネット越しにパドルでボールを打ち合います。サーブは対角線上に打ち、キッチン（ノーボレーゾーン）内ではボレーが禁止されています。</p>",
    publishedAt: "2026-02-15T00:00:00.000Z",
    createdAt: "2026-02-15T00:00:00.000Z",
    updatedAt: "2026-02-15T00:00:00.000Z",
  },
};

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

export async function generateStaticParams() {
  try {
    const slugs = await getAllArticleSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return Object.keys(fallbackArticles).map((slug) => ({ slug }));
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  let article: Article | null = null;
  try {
    article = await getArticleBySlug(slug);
  } catch {
    article = fallbackArticles[slug] ?? null;
  }

  if (!article) return { title: "記事が見つかりません" };

  return {
    title: article.title,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      images: [
        `/api/og?type=article&title=${encodeURIComponent(article.title)}`,
      ],
    },
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;

  let article: Article | null = null;
  try {
    article = await getArticleBySlug(slug);
  } catch {
    article = fallbackArticles[slug] ?? null;
  }

  if (!article) {
    notFound();
  }

  return (
    <>
    <ArticleJsonLd
      title={article.title}
      description={article.description}
      slug={article.slug}
      publishedAt={article.publishedAt}
      updatedAt={article.updatedAt}
      thumbnailUrl={article.thumbnail?.url}
    />
    <BreadcrumbJsonLd
      items={[
        { name: "ホーム", url: "https://pikura.app" },
        { name: "記事一覧", url: "https://pikura.app/articles" },
        { name: article.title, url: `https://pikura.app/articles/${article.slug}` },
      ]}
    />
    <article className="container mx-auto max-w-3xl px-4 py-12">
      {article.thumbnail && (
        <div className="relative mb-8 aspect-video overflow-hidden rounded-lg">
          <Image
            src={article.thumbnail.url}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>
      )}
      <div className="mb-4">
        <Badge variant="secondary">
          {categoryLabels[article.category] ?? article.category}
        </Badge>
      </div>
      <h1 className="mb-4 text-3xl font-bold">{article.title}</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        {formatDate(article.publishedAt)}
      </p>
      <Separator className="mb-8" />
      <div
        className="prose max-w-none prose-headings:font-bold prose-a:text-primary prose-img:rounded-lg"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* 内部リンク: ランキングへの導線 */}
      <Separator className="my-10" />
      <div className="rounded-lg border bg-muted/30 p-6 text-center">
        <p className="text-lg font-bold">JPA公式ランキングをチェック</p>
        <p className="mt-2 text-sm text-muted-foreground">
          日本ピックルボール協会（JPA）公式ランキングを、カテゴリ別・年齢別で検索できます。
        </p>
        <Button asChild className="mt-4">
          <Link href="/rankings">ランキングを見る</Link>
        </Button>
      </div>

      {/* 関連記事リンク */}
      <div className="mt-8">
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          関連記事
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/articles">記事一覧を見る</Link>
          </Button>
        </div>
      </div>
    </article>
    </>
  );
}
