import { microcmsClient } from "./client";
import type { Article, MicroCMSListResponse } from "@/types";

export async function getArticleList(params?: {
  limit?: number;
  offset?: number;
  category?: string;
}): Promise<MicroCMSListResponse<Article>> {
  const filters: string[] = [];
  if (params?.category) filters.push(`category[equals]${params.category}`);

  const response = await microcmsClient.getList<Article>({
    endpoint: "articles",
    queries: {
      limit: params?.limit ?? 10,
      offset: params?.offset ?? 0,
      filters: filters.length > 0 ? filters.join("[and]") : undefined,
      orders: "-publishedAt",
      fields: [
        "id",
        "title",
        "slug",
        "description",
        "thumbnail",
        "category",
        "publishedAt",
      ],
    },
    customRequestInit: {
      next: { revalidate: 3600 },
    },
  });

  return response;
}

export async function getArticleBySlug(
  slug: string,
): Promise<Article | null> {
  const response = await microcmsClient.getList<Article>({
    endpoint: "articles",
    queries: {
      filters: `slug[equals]${slug}`,
      limit: 1,
    },
    customRequestInit: {
      next: { revalidate: 3600 },
    },
  });

  return response.contents[0] ?? null;
}

export async function getAllArticleSlugs(): Promise<string[]> {
  const response = await microcmsClient.getList<Article>({
    endpoint: "articles",
    queries: {
      fields: ["slug"],
      limit: 100,
      orders: "-publishedAt",
    },
  });

  return response.contents.map((article) => article.slug);
}
