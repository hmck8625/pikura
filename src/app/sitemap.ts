import type { MetadataRoute } from "next";
import { getAllArticleSlugs } from "@/lib/microcms/queries";
import { getAllPlayerSlugs } from "@/lib/ranking/data";
import { getAllEventIds } from "@/lib/events/data";
import { getAllProductSlugs } from "@/lib/shop/data";
import { getAllCoachSlugs } from "@/lib/coaching/data";

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

  // ショップ商品ページ
  const productEntries: MetadataRoute.Sitemap = getAllProductSlugs().map(
    (slug) => ({
      url: `${BASE_URL}/shop/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }),
  );

  // コーチングページ
  const coachEntries: MetadataRoute.Sitemap = getAllCoachSlugs().map(
    (slug) => ({
      url: `${BASE_URL}/coaching/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }),
  );

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
      url: `${BASE_URL}/coaching`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...coachEntries,
    {
      url: `${BASE_URL}/shop`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...productEntries,
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
