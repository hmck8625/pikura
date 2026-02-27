#!/usr/bin/env node

/**
 * ピックルボールイベントデータ統合取得スクリプト
 *
 * 1. JPA WordPress REST API から自動取得
 * 2. manual-events.json から手動登録分を読み込み
 * 3. マージ → 重複排除 → ソート
 * 4. src/lib/events/data.ts に PickleballEvent 形式で書き出し
 *
 * 使い方:
 *   node scripts/fetch-all-events.mjs
 */

import { writeFileSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, "../src/lib/events/data.ts");
const MANUAL_EVENTS_PATH = resolve(__dirname, "manual-events.json");

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

// 都道府県リスト
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
    .replace(/&hellip;/g, "…")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * テキストから日付を抽出（yyyy年mm月dd日 or yyyy/mm/dd パターン）
 */
function extractEventDate(text) {
  const jpMatch = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (jpMatch) {
    const [, y, m, d] = jpMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const slashMatch = text.match(/(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})/);
  if (slashMatch) {
    const [, y, m, d] = slashMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const noYearMatch = text.match(/(\d{1,2})月(\d{1,2})日/);
  if (noYearMatch) {
    const [, m, d] = noYearMatch;
    const year = new Date().getFullYear();
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return null;
}

/**
 * テキストから都道府県を抽出
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
  const venueMatch = text.match(/(?:会場|場所|開催地)[：:]\s*(.+?)(?:\n|$)/);
  if (venueMatch) {
    return venueMatch[1].trim();
  }

  const prefecture = extractPrefecture(text);
  if (prefecture) {
    return prefecture;
  }

  return null;
}

/**
 * テキストから参加費を抽出
 */
function extractEntryFee(text) {
  // "参加費：3,000円" "参加費: ¥3,000" "参加費（1人）3000円" etc.
  const feeMatch = text.match(/(?:参加費|エントリー費|受講料|費用)[（(]?[^）)]*[）)]?[：:．.・]?\s*[¥￥]?([\d,]+)\s*円/);
  if (feeMatch) {
    return `¥${feeMatch[1]}`;
  }

  // "無料" パターン
  if (/(?:参加費|エントリー費)[：:．.・]?\s*無料/.test(text)) {
    return "無料";
  }

  return null;
}

/**
 * テキストからレベルを推定
 */
function extractLevel(text) {
  const lower = text.toLowerCase();
  if (/初心者|初級|ビギナー|beginner/i.test(lower)) return "beginner";
  if (/中級|intermediate/i.test(lower)) return "intermediate";
  if (/上級|アドバンス|advanced/i.test(lower)) return "advanced";
  if (/オープン|open/i.test(lower)) return "open";
  return "unknown";
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
 * WordPress REST API からイベント記事を取得（ページネーション対応）
 */
async function fetchAllPosts() {
  const allPosts = [];
  let page = 1;
  const perPage = 50;

  while (true) {
    const url = `${API_BASE}?categories=${ALL_CATEGORY_IDS}&per_page=${perPage}&page=${page}&_fields=id,title,date,link,excerpt,content,categories`;

    console.log(`  ページ ${page} を取得中...`);

    const res = await fetch(url);

    if (!res.ok) {
      if (res.status === 400) {
        break;
      }
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    const posts = await res.json();
    if (posts.length === 0) break;

    allPosts.push(...posts);

    const totalPages = parseInt(res.headers.get("X-WP-TotalPages") || "1", 10);
    if (page >= totalPages) break;

    page++;
    await new Promise((r) => setTimeout(r, 500));
  }

  return allPosts;
}

/**
 * WordPress記事を PickleballEvent に変換
 */
function transformPost(post) {
  const title = stripHtml(post.title.rendered);
  const excerpt = stripHtml(post.excerpt.rendered);
  const content = stripHtml(post.content.rendered);
  const fullText = `${title}\n${excerpt}\n${content}`;

  const eventDate = extractEventDate(fullText);
  const location = extractLocation(fullText);
  const prefecture = extractPrefecture(fullText);
  const category = resolveCategory(post.categories);
  const description = excerpt || content.slice(0, 200);
  const entryFee = extractEntryFee(fullText);
  const level = extractLevel(fullText);

  return {
    id: `jpa-${post.id}`,
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
    level,
    duprReflected: null,
    entryFee,
    format: ["unknown"],
    registrationStatus: "unknown",
    registrationUrl: null,
    maxParticipants: null,
    currentParticipants: null,
    eventEndDate: null,
    latitude: null,
    longitude: null,
    sourceEventId: String(post.id),
  };
}

/**
 * manual-events.json を読み込み、PickleballEvent 形式に正規化
 */
function loadManualEvents() {
  try {
    const raw = readFileSync(MANUAL_EVENTS_PATH, "utf-8");
    const events = JSON.parse(raw);

    return events.map((e, i) => ({
      id: e.id || `manual-${Date.now()}-${i}`,
      title: e.title || "",
      description: e.description || "",
      eventDate: e.eventDate || null,
      location: e.location || null,
      prefecture: e.prefecture || null,
      category: e.category || "other",
      sourceUrl: e.sourceUrl || "",
      source: e.source || "manual",
      publishedAt: e.publishedAt || new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
      level: e.level || "unknown",
      duprReflected: e.duprReflected ?? null,
      entryFee: e.entryFee || null,
      format: e.format || ["unknown"],
      registrationStatus: e.registrationStatus || "unknown",
      registrationUrl: e.registrationUrl || null,
      maxParticipants: e.maxParticipants ?? null,
      currentParticipants: e.currentParticipants ?? null,
      eventEndDate: e.eventEndDate || null,
      latitude: e.latitude ?? null,
      longitude: e.longitude ?? null,
      sourceEventId: e.sourceEventId || null,
    }));
  } catch (err) {
    console.log("  手動イベントファイルが見つからないか空です。スキップします。");
    return [];
  }
}

/**
 * 重複排除（sourceUrl ベース）
 */
function deduplicateEvents(events) {
  const seen = new Map();
  for (const event of events) {
    const key = event.sourceUrl || event.id;
    if (!seen.has(key)) {
      seen.set(key, event);
    }
  }
  return Array.from(seen.values());
}

/**
 * TypeScript データファイルを生成
 */
function generateDataFile(events) {
  const eventsJson = JSON.stringify(events, null, 2)
    .replace(/\\u[\dA-Fa-f]{4}/g, (match) =>
      String.fromCharCode(parseInt(match.replace("\\u", ""), 16))
    );

  return `// ピックルボールイベントデータ（自動生成 - 手動編集しないこと）
// 生成日時: ${new Date().toISOString()}
// ソース: JPA WordPress REST API + 手動キュレーション

import type { PickleballEvent, EventCategory } from "./types";

export { type PickleballEvent, type EventCategory } from "./types";
export { EVENT_CATEGORY_LABELS } from "./types";

const EVENTS: PickleballEvent[] = ${eventsJson};

/** 全イベント取得 */
export function getEvents(): PickleballEvent[] {
  return EVENTS;
}

/** 今後のイベント（日付順・直近順） */
export function getUpcomingEvents(limit?: number): PickleballEvent[] {
  const now = new Date().toISOString().split("T")[0];
  const upcoming = EVENTS
    .filter((e) => {
      if (!e.eventDate) return true;
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
export function getPastEvents(): PickleballEvent[] {
  const now = new Date().toISOString().split("T")[0];
  return EVENTS
    .filter((e) => e.eventDate && e.eventDate < now)
    .sort((a, b) => (b.eventDate ?? "").localeCompare(a.eventDate ?? ""));
}

/** カテゴリでフィルター */
export function getEventsByCategory(category: EventCategory): PickleballEvent[] {
  return EVENTS.filter((e) => e.category === category);
}

/** IDでイベント取得 */
export function getEventById(id: string): PickleballEvent | undefined {
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
  console.log("ピックルボールイベントデータ統合取得");
  console.log("=".repeat(60));
  console.log("");

  try {
    // 1. JPA APIからデータ取得
    console.log("1. JPA サイトからデータ取得中...");
    const posts = await fetchAllPosts();
    console.log(`   ${posts.length} 件の記事を取得しました。`);

    console.log("\n2. イベントデータに変換中...");
    const jpaEvents = posts.map(transformPost);

    // 2. 手動イベント読み込み
    console.log("\n3. 手動キュレーションデータ読み込み中...");
    const manualEvents = loadManualEvents();
    console.log(`   ${manualEvents.length} 件の手動イベントを読み込みました。`);

    // 3. マージ＆重複排除
    console.log("\n4. マージ＆重複排除...");
    const allEvents = deduplicateEvents([...jpaEvents, ...manualEvents]);

    // ソート（日付順）
    allEvents.sort((a, b) => {
      if (!a.eventDate && !b.eventDate) return 0;
      if (!a.eventDate) return 1;
      if (!b.eventDate) return -1;
      return b.eventDate.localeCompare(a.eventDate);
    });

    // 統計表示
    const withDate = allEvents.filter((e) => e.eventDate).length;
    const withLocation = allEvents.filter((e) => e.location).length;
    const withFee = allEvents.filter((e) => e.entryFee).length;
    const withLevel = allEvents.filter((e) => e.level !== "unknown").length;
    const sources = {};
    const categories = {};
    for (const e of allEvents) {
      sources[e.source] = (sources[e.source] || 0) + 1;
      categories[e.category] = (categories[e.category] || 0) + 1;
    }

    console.log(`   合計: ${allEvents.length} 件（重複排除後）`);
    console.log(`   日付抽出: ${withDate}/${allEvents.length} 件`);
    console.log(`   場所抽出: ${withLocation}/${allEvents.length} 件`);
    console.log(`   参加費抽出: ${withFee}/${allEvents.length} 件`);
    console.log(`   レベル抽出: ${withLevel}/${allEvents.length} 件`);
    console.log("   ソース分布:");
    for (const [src, count] of Object.entries(sources)) {
      console.log(`     ${src}: ${count} 件`);
    }
    console.log("   カテゴリ分布:");
    for (const [cat, count] of Object.entries(categories)) {
      console.log(`     ${cat}: ${count} 件`);
    }

    // ファイル書き出し
    console.log(`\n5. データファイル書き出し: ${OUTPUT_PATH}`);
    const fileContent = generateDataFile(allEvents);
    writeFileSync(OUTPUT_PATH, fileContent, "utf-8");
    console.log("   完了!");

    console.log(`\n${"=".repeat(60)}`);
    console.log(`合計 ${allEvents.length} 件のイベントデータを書き出しました。`);
    console.log(`  JPA: ${sources["jpa"] || 0} 件`);
    console.log(`  手動: ${(sources["tennisbear"] || 0) + (sources["pjf"] || 0) + (sources["manual"] || 0)} 件`);
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
