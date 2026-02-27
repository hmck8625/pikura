import type { MetadataRoute } from "next";
import { getAllArticleSlugs } from "@/lib/microcms/queries";
import { getAllPlayerSlugs } from "@/lib/ranking/data";
import { getAllEventIds } from "@/lib/events/data";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let articleSlugs: string[] = [];
  try {
    articleSlugs = await getAllArticleSlugs();
  } catch {
    // microCMS unavailable - continue with static pages only
  }

  const articleEntries: MetadataRoute.Sitemap = articleSlugs.map((slug) => ({
    url: `${BASE_URL}/articles/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // 選手ページ（124名分）
  const playerEntries: MetadataRoute.Sitemap = getAllPlayerSlugs().map(
    (slug) => ({
      url: `${BASE_URL}/players/${encodeURIComponent(slug)}`,
      lastModified: new Date("2026-02-26"),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })
  );

  // イベント個別ページ
  const eventEntries: MetadataRoute.Sitemap = getAllEventIds().map((id) => ({
    url: `${BASE_URL}/events/${id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/articles`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/rankings`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/events`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/pairs`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    ...articleEntries,
    ...playerEntries,
    ...eventEntries,
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
