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
    title: "ピックルボールとは？初心者向け完全ガイド【2026年最新】",
    slug: "what-is-pickleball",
    category: "beginner",
    description: "ピックルボールの基本ルール・魅力・歴史から日本の最新動向まで。これを読めば全体像がわかります。",
    content: "",
    publishedAt: "2026-02-26T00:00:00.000Z",
    createdAt: "2026-02-26T00:00:00.000Z",
    updatedAt: "2026-02-26T00:00:00.000Z",
  },
  {
    id: "2",
    title: "ピックルボールの始め方｜初心者が揃えるべき道具・費用・練習場所",
    slug: "how-to-start-pickleball",
    category: "beginner",
    description: "パドル・ボール・シューズの選び方から練習場所の探し方まで、ゼロから始める5ステップを解説。",
    content: "",
    publishedAt: "2026-02-25T00:00:00.000Z",
    createdAt: "2026-02-25T00:00:00.000Z",
    updatedAt: "2026-02-25T00:00:00.000Z",
  },
  {
    id: "3",
    title: "ピックルボールのルール完全解説｜サーブ・得点・キッチン",
    slug: "pickleball-rules",
    category: "rules",
    description: "サーブルール、スコアリング、キッチン（ノンボレーゾーン）など、2026年最新ルールを徹底解説。",
    content: "",
    publishedAt: "2026-02-24T00:00:00.000Z",
    createdAt: "2026-02-24T00:00:00.000Z",
    updatedAt: "2026-02-24T00:00:00.000Z",
  },
  {
    id: "4",
    title: "ピックルボールのパドルおすすめ10選｜初心者〜上級者の選び方",
    slug: "paddle-guide",
    category: "gear",
    description: "JOOLA、Selkirk、Franklinなど人気パドル10モデルを徹底比較。素材・重さ・価格別の選び方ガイド。",
    content: "",
    publishedAt: "2026-02-23T00:00:00.000Z",
    createdAt: "2026-02-23T00:00:00.000Z",
    updatedAt: "2026-02-23T00:00:00.000Z",
  },
  {
    id: "5",
    title: "東京でピックルボールができる場所まとめ｜専用コート・体験会",
    slug: "tokyo-pickleball-courts",
    category: "beginner",
    description: "池袋・渋谷・お台場など東京都内のピックルボール施設6選。料金・アクセス・予約方法付き。",
    content: "",
    publishedAt: "2026-02-22T00:00:00.000Z",
    createdAt: "2026-02-22T00:00:00.000Z",
    updatedAt: "2026-02-22T00:00:00.000Z",
  },
  {
    id: "6",
    title: "ピックルボール ダブルス戦術ガイド｜勝てるペアになるための基本と応用",
    slug: "doubles-tactics",
    category: "tips",
    description: "3rdショットドロップ、ディンク戦、スタッキング、ポーチなど、ダブルスで勝つための戦術を網羅。",
    content: "",
    publishedAt: "2026-02-21T00:00:00.000Z",
    createdAt: "2026-02-21T00:00:00.000Z",
    updatedAt: "2026-02-21T00:00:00.000Z",
  },
  {
    id: "7",
    title: "ピックルボール コートのサイズ・寸法と設営方法",
    slug: "court-size-setup",
    category: "rules",
    description: "コート寸法、テニス/バドミントンコートとの比較、自宅・体育館での設営方法と費用を解説。",
    content: "",
    publishedAt: "2026-02-20T00:00:00.000Z",
    createdAt: "2026-02-20T00:00:00.000Z",
    updatedAt: "2026-02-20T00:00:00.000Z",
  },
  {
    id: "8",
    title: "ピックルボール シューズおすすめ8選｜インドア・アウトドア別",
    slug: "shoes-guide",
    category: "gear",
    description: "ミズノ、アシックス、ヨネックスなどインドア・アウトドア別おすすめ8足を価格・特徴付きで紹介。",
    content: "",
    publishedAt: "2026-02-19T00:00:00.000Z",
    createdAt: "2026-02-19T00:00:00.000Z",
    updatedAt: "2026-02-19T00:00:00.000Z",
  },
  {
    id: "9",
    title: "初めてのピックルボール大会参加ガイド｜エントリーから当日まで",
    slug: "first-tournament-guide",
    category: "events",
    description: "JPA大会の種類、エントリー方法、持ち物、当日の流れ。初心者が出やすい大会情報付き。",
    content: "",
    publishedAt: "2026-02-18T00:00:00.000Z",
    createdAt: "2026-02-18T00:00:00.000Z",
    updatedAt: "2026-02-18T00:00:00.000Z",
  },
  {
    id: "10",
    title: "JPA公式ランキングの仕組み｜ポイント計算・カテゴリ・載り方",
    slug: "jpa-ranking-explained",
    category: "events",
    description: "2026年1月に開始されたJPA公式ランキング制度を徹底解説。ポイント計算、カテゴリ分類、DUPRとの違い。",
    content: "",
    publishedAt: "2026-02-17T00:00:00.000Z",
    createdAt: "2026-02-17T00:00:00.000Z",
    updatedAt: "2026-02-17T00:00:00.000Z",
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
