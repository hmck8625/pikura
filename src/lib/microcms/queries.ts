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

export async function getRelatedArticles(
  slug: string,
  category: string,
  limit = 4,
): Promise<Article[]> {
  const response = await microcmsClient.getList<Article>({
    endpoint: "articles",
    queries: {
      filters: `slug[not_equals]${slug}[and]category[equals]${category}`,
      limit,
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

  return response.contents;
}

export async function getAllArticleSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  const PER_PAGE = 100;
  let offset = 0;
  let totalCount = 0;

  do {
    const response = await microcmsClient.getList<Article>({
      endpoint: "articles",
      queries: {
        fields: ["slug"],
        limit: PER_PAGE,
        offset,
        orders: "-publishedAt",
      },
    });

    slugs.push(...response.contents.map((article) => article.slug));
    totalCount = response.totalCount;
    offset += PER_PAGE;
  } while (offset < totalCount);

  return slugs;
}
