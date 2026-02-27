#!/usr/bin/env node

/**
 * JPA イベントデータ取得スクリプト
 *
 * WordPress REST API から JPA（日本ピックルボール協会）のイベント・大会情報を取得し、
 * src/lib/events/data.ts に静的 TypeScript データとして書き出す。
 *
 * 使い方:
 *   node scripts/fetch-jpa-events.mjs
 */

import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, "../src/lib/events/data.ts");

// JPA WordPress REST API
const API_BASE = "https://japanpickleball.org/wp-json/wp/v2/posts";

// カテゴリID → 内部カテゴリ名のマッピング
const CATEGORY_MAP = {
  // 大会系
  4: "tournament",   // 主催大会
  6: "tournament",   // JPA TOURS
  5: "tournament",   // 公認大会
  2: "tournament",   // 国際大会
  7: "tournament",   // その他大会
  // イベント系
  16: "experience",  // 協会主催イベント
  17: "experience",  // 体験会・交流会
  18: "certification", // 資格講習会
  14: "workshop",    // JPAイベント
};

const ALL_CATEGORY_IDS = Object.keys(CATEGORY_MAP).join(",");

// 都道府県リスト（場所から県名を抽出するため）
const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

/**
 * HTMLタグを除去してプレーンテキストに変換
 */
function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * テキストから日付を抽出（yyyy年mm月dd日 or yyyy/mm/dd パターン）
 */
function extractEventDate(text) {
  // yyyy年mm月dd日
  const jpMatch = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (jpMatch) {
    const [, y, m, d] = jpMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // yyyy/mm/dd or yyyy-mm-dd
  const slashMatch = text.match(/(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})/);
  if (slashMatch) {
    const [, y, m, d] = slashMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // mm月dd日 (年なしの場合、投稿年を使う)
  const noYearMatch = text.match(/(\d{1,2})月(\d{1,2})日/);
  if (noYearMatch) {
    const [, m, d] = noYearMatch;
    const year = new Date().getFullYear();
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return null;
}

/**
 * テキストから場所（都道府県）を抽出
 */
function extractPrefecture(text) {
  for (const pref of PREFECTURES) {
    if (text.includes(pref)) {
      return pref;
    }
  }
  return null;
}

/**
 * テキストから会場名を抽出
 */
function extractLocation(text) {
  // 「会場：○○」「場所：○○」パターン
  const venueMatch = text.match(/(?:会場|場所|開催地)[：:]\s*(.+?)(?:\n|$)/);
  if (venueMatch) {
    return venueMatch[1].trim();
  }

  // 都道府県名を含む行を会場候補とする
  const prefecture = extractPrefecture(text);
  if (prefecture) {
    return prefecture;
  }

  return null;
}

/**
 * WP カテゴリIDから内部カテゴリを判定
 */
function resolveCategory(wpCategories) {
  for (const catId of wpCategories) {
    if (CATEGORY_MAP[catId]) {
      return CATEGORY_MAP[catId];
    }
  }
  return "other";
}

/**
 * スラグ生成（イベントID用）
 */
function generateEventId(wpId, title) {
  const slug = title
    .replace(/[【】「」『』（）()]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50);
  return `jpa-${wpId}`;
}

/**
 * WordPress REST API からイベント記事を取得（ページネーション対応）
 */
async function fetchAllPosts() {
  const allPosts = [];
  let page = 1;
  const perPage = 50;

  while (true) {
    const url = `${API_BASE}?categories=${ALL_CATEGORY_IDS}&per_page=${perPage}&page=${page}&_fields=id,title,date,link,excerpt,content,categories`;

    console.log(`  ページ ${page} を取得中... (${url.split("?")[0]})`);

    const res = await fetch(url);

    if (!res.ok) {
      if (res.status === 400) {
        // ページ範囲外 — 全ページ取得完了
        break;
      }
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    const posts = await res.json();
    if (posts.length === 0) break;

    allPosts.push(...posts);

    // 全ページ取得済みかチェック
    const totalPages = parseInt(res.headers.get("X-WP-TotalPages") || "1", 10);
    if (page >= totalPages) break;

    page++;

    // レートリミット対策
    await new Promise((r) => setTimeout(r, 500));
  }

  return allPosts;
}

/**
 * WordPress記事をJpaEventに変換
 */
function transformPost(post) {
  const title = stripHtml(post.title.rendered);
  const excerpt = stripHtml(post.excerpt.rendered);
  const content = stripHtml(post.content.rendered);

  // コンテンツ全体からイベント情報を抽出
  const fullText = `${title}\n${excerpt}\n${content}`;

  const eventDate = extractEventDate(fullText);
  const location = extractLocation(fullText);
  const prefecture = extractPrefecture(fullText);
  const category = resolveCategory(post.categories);

  // 説明文（excerptをそのまま使うか、contentの先頭200文字）
  const description = excerpt || content.slice(0, 200);

  return {
    id: generateEventId(post.id, title),
    title,
    description,
    eventDate,
    location,
    prefecture,
    category,
    sourceUrl: post.link,
    source: "jpa",
    publishedAt: post.date,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * TypeScriptデータファイルを生成
 */
function generateDataFile(events) {
  const eventsJson = JSON.stringify(events, null, 2)
    // JSON内の日本語がエスケープされないようにする
    .replace(/\\u[\dA-Fa-f]{4}/g, (match) =>
      String.fromCharCode(parseInt(match.replace("\\u", ""), 16))
    );

  return `// JPA イベントデータ（自動生成 - 手動編集しないこと）
// 生成日時: ${new Date().toISOString()}
// ソース: https://japanpickleball.org (WordPress REST API)

export type JpaEvent = {
  id: string;
  title: string;
  description: string;
  eventDate: string | null;
  location: string | null;
  prefecture: string | null;
  category: "tournament" | "experience" | "workshop" | "certification" | "other";
  sourceUrl: string;
  source: "jpa";
  publishedAt: string;
  fetchedAt: string;
};

export type EventCategory = JpaEvent["category"];

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  tournament: "大会",
  experience: "体験会・交流会",
  workshop: "イベント",
  certification: "資格講習会",
  other: "その他",
};

const EVENTS: JpaEvent[] = ${eventsJson};

/** 全イベント取得 */
export function getEvents(): JpaEvent[] {
  return EVENTS;
}

/** 今後のイベント（日付順・直近順） */
export function getUpcomingEvents(limit?: number): JpaEvent[] {
  const now = new Date().toISOString().split("T")[0];
  const upcoming = EVENTS
    .filter((e) => {
      if (!e.eventDate) return true; // 日付不明は含める
      return e.eventDate >= now;
    })
    .sort((a, b) => {
      if (!a.eventDate) return 1;
      if (!b.eventDate) return -1;
      return a.eventDate.localeCompare(b.eventDate);
    });
  return limit ? upcoming.slice(0, limit) : upcoming;
}

/** 過去のイベント（新しい順） */
export function getPastEvents(): JpaEvent[] {
  const now = new Date().toISOString().split("T")[0];
  return EVENTS
    .filter((e) => e.eventDate && e.eventDate < now)
    .sort((a, b) => (b.eventDate ?? "").localeCompare(a.eventDate ?? ""));
}

/** カテゴリでフィルター */
export function getEventsByCategory(category: EventCategory): JpaEvent[] {
  return EVENTS.filter((e) => e.category === category);
}

/** IDでイベント取得 */
export function getEventById(id: string): JpaEvent | undefined {
  return EVENTS.find((e) => e.id === id);
}

/** 全イベントID一覧（generateStaticParams用） */
export function getAllEventIds(): string[] {
  return EVENTS.map((e) => e.id);
}
`;
}

// --- メイン処理 ---

async function main() {
  console.log("=".repeat(60));
  console.log("JPA イベントデータ取得");
  console.log("=".repeat(60));
  console.log("");
  console.log("WordPress REST API からイベント・大会情報を取得します。");
  console.log(`対象カテゴリ: ${ALL_CATEGORY_IDS}`);
  console.log("");

  try {
    // API からデータ取得
    console.log("1. JPA サイトからデータ取得中...");
    const posts = await fetchAllPosts();
    console.log(`   ${posts.length} 件の記事を取得しました。`);

    // データ変換
    console.log("\n2. イベントデータに変換中...");
    const events = posts.map(transformPost);

    // 統計表示
    const withDate = events.filter((e) => e.eventDate).length;
    const withLocation = events.filter((e) => e.location).length;
    const categories = {};
    for (const e of events) {
      categories[e.category] = (categories[e.category] || 0) + 1;
    }

    console.log(`   日付抽出: ${withDate}/${events.length} 件`);
    console.log(`   場所抽出: ${withLocation}/${events.length} 件`);
    console.log("   カテゴリ分布:");
    for (const [cat, count] of Object.entries(categories)) {
      console.log(`     ${cat}: ${count} 件`);
    }

    // ファイル書き出し
    console.log(`\n3. データファイル書き出し: ${OUTPUT_PATH}`);
    const fileContent = generateDataFile(events);
    writeFileSync(OUTPUT_PATH, fileContent, "utf-8");
    console.log("   完了!");

    console.log(`\n${"=".repeat(60)}`);
    console.log(`合計 ${events.length} 件のイベントデータを書き出しました。`);
    console.log("=".repeat(60));
  } catch (error) {
    console.error(`\nエラー: ${error.message}`);

    if (error.cause?.code === "ENOTFOUND" || error.message.includes("fetch")) {
      console.error("\nネットワークエラー: JPA サイトに接続できません。");
      console.error("インターネット接続を確認してください。");
    }

    process.exit(1);
  }
}

main();
