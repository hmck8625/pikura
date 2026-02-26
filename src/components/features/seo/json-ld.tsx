const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pikura.app";

// サイト全体のOrganization + WebSite構造化データ
export function WebsiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${BASE_URL}/#website`,
        url: BASE_URL,
        name: "ピクラ",
        alternateName: "pikura",
        description:
          "日本最大のピックルボール総合プラットフォーム。JPA公式ランキング、最新ニュース、イベント情報。",
        inLanguage: "ja",
      },
      {
        "@type": "Organization",
        "@id": `${BASE_URL}/#organization`,
        name: "ピクラ",
        url: BASE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${BASE_URL}/icon.svg`,
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// 記事ページの構造化データ
export function ArticleJsonLd({
  title,
  description,
  slug,
  publishedAt,
  updatedAt,
  thumbnailUrl,
}: {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: `${BASE_URL}/articles/${slug}`,
    datePublished: publishedAt,
    dateModified: updatedAt,
    author: {
      "@type": "Organization",
      name: "ピクラ編集部",
      url: BASE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "ピクラ",
      url: BASE_URL,
    },
    ...(thumbnailUrl && {
      image: {
        "@type": "ImageObject",
        url: thumbnailUrl,
      },
    }),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/articles/${slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// 選手ページの構造化データ
export function PlayerJsonLd({
  name,
  slug,
  bestRank,
  totalPoints,
  bestCategory,
}: {
  name: string;
  slug: string;
  bestRank: number;
  totalPoints: number;
  bestCategory: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    url: `${BASE_URL}/players/${encodeURIComponent(slug)}`,
    description: `${name} - JPA公式ピックルボールランキング ${bestCategory} ${bestRank}位 / ${totalPoints}pt`,
    memberOf: {
      "@type": "SportsOrganization",
      name: "日本ピックルボール協会（JPA）",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// パンくずリストの構造化データ
export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
