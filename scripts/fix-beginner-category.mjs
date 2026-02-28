#!/usr/bin/env node

/**
 * microCMS の beginner カテゴリ修正スクリプト
 *
 * microCMS のスキーマに beginner を追加した後に実行する。
 * category が空の記事を検索し、beginner カテゴリを設定する。
 *
 * 使い方:
 *   MICROCMS_WRITE_KEY=xxx node scripts/fix-beginner-category.mjs
 *   MICROCMS_WRITE_KEY=xxx node scripts/fix-beginner-category.mjs --dry-run
 */

const SERVICE_DOMAIN = "pikura";
const WRITE_KEY = process.env.MICROCMS_WRITE_KEY;

if (!WRITE_KEY) {
  console.error("MICROCMS_WRITE_KEY が未設定です");
  process.exit(1);
}

const isDryRun = process.argv.includes("--dry-run");

// beginner カテゴリであるべき記事のスラッグ一覧
const BEGINNER_SLUGS = [
  "what-is-pickleball",
  "how-to-start-pickleball",
  "tokyo-pickleball-courts",
  "youtube-channels",
  "osaka-pickleball",
  "nagoya-pickleball-courts",
  "pickleball-vs-tennis",
  "kanagawa-pickleball-courts",
  "court-reservation-guide",
  "fukuoka-pickleball-courts",
  "saitama-chiba-pickleball",
  "hokkaido-pickleball",
  "kyoto-pickleball",
  "sendai-tohoku-pickleball",
  "pickleball-vs-badminton",
  "pickleball-history",
  "senior-pickleball-guide",
  "junior-pickleball-guide",
  "pickleball-circle-guide",
  "pickleball-places-japan",
  "pickleball-health-benefits",
  "pickleball-population-japan",
  "pickleball-vs-padel",
  "pickleball-experience-guide",
  "pickleball-lesson-school",
  "pickleball-cost-guide",
  "pickleball-olympics",
  "pickleball-for-women",
  "pickleball-corporate-event",
  "pickleball-family-guide",
  "pickleball-celebrities",
  "pickleball-complete-guide",
  "pickleball-courts-japan",
  "pickleball-for-everyone",
  "kobe-hyogo-pickleball",
  "hiroshima-pickleball",
  "okinawa-pickleball",
  "shizuoka-pickleball",
  "ibaraki-pickleball",
  "gunma-tochigi-pickleball",
  "pickleball-vs-tabletennis",
  "pickleball-noise-guide",
  "pickleball-court-diy",
  "tennis-to-pickleball",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function findArticleBySlug(slug) {
  const url = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/articles?filters=slug[equals]${slug}&fields=id,slug,category&limit=1`;
  const res = await fetch(url, {
    headers: { "X-MICROCMS-API-KEY": WRITE_KEY },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.contents[0] ?? null;
}

async function patchCategory(contentId, slug) {
  const url = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/articles/${contentId}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "X-MICROCMS-API-KEY": WRITE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ category: ["beginner"] }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`  ❌ PATCH失敗 (${res.status}): ${text}`);
    return false;
  }
  return true;
}

async function main() {
  console.log("=".repeat(60));
  console.log("🔧 beginner カテゴリ修正スクリプト");
  console.log(`   対象: ${BEGINNER_SLUGS.length} 件`);
  if (isDryRun) console.log("   ⚠️  DRY RUN モード（実際の更新なし）");
  console.log("=".repeat(60));

  let fixed = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < BEGINNER_SLUGS.length; i++) {
    const slug = BEGINNER_SLUGS[i];
    console.log(`\n[${i + 1}/${BEGINNER_SLUGS.length}] ${slug}`);

    const article = await findArticleBySlug(slug);
    if (!article) {
      console.log("  ⚠️  記事が見つかりません（スキップ）");
      failed++;
      continue;
    }

    // カテゴリが既に beginner なら スキップ
    if (article.category && article.category.includes("beginner")) {
      console.log("  ✅ 既に beginner 設定済み（スキップ）");
      skipped++;
      continue;
    }

    console.log(`  📝 カテゴリ: ${JSON.stringify(article.category)} → ["beginner"]`);

    if (isDryRun) {
      console.log("  🔍 DRY RUN: 更新をスキップ");
      fixed++;
      continue;
    }

    const ok = await patchCategory(article.id, slug);
    if (ok) {
      console.log("  ✅ 修正完了");
      fixed++;
    } else {
      failed++;
    }

    await sleep(300);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`📊 結果: 修正 ${fixed} / スキップ ${skipped} / 失敗 ${failed}`);
  console.log("=".repeat(60));
}

main().catch((e) => {
  console.error("エラー:", e);
  process.exit(1);
});
