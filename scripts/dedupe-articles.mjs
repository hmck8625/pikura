/**
 * microCMS 重複記事検出・削除スクリプト
 *
 * 使い方:
 *   node scripts/dedupe-articles.mjs                                    # ドライラン（確認のみ）
 *   MICROCMS_WRITE_KEY=xxxx node scripts/dedupe-articles.mjs --delete   # 実際に削除
 *   MICROCMS_WRITE_KEY=xxxx node scripts/dedupe-articles.mjs --delete --keep=older  # 古い方を残す
 */

const SERVICE_DOMAIN = "pikura";
const API_KEY =
  process.env.MICROCMS_WRITE_KEY || process.env.MICROCMS_API_KEY;

if (!API_KEY) {
  console.error("MICROCMS_WRITE_KEY または MICROCMS_API_KEY が未設定です");
  console.error("");
  console.error("使い方:");
  console.error(
    "  MICROCMS_API_KEY=xxxxx node scripts/dedupe-articles.mjs          # 確認のみ"
  );
  console.error(
    "  MICROCMS_WRITE_KEY=xxxxx node scripts/dedupe-articles.mjs --delete  # 削除実行"
  );
  process.exit(1);
}

const shouldDelete = process.argv.includes("--delete");
const keepOlder = process.argv.includes("--keep=older");

/**
 * 全記事を取得（ページネーション対応）
 */
async function fetchAllArticles() {
  const allContents = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const url = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/articles?fields=id,slug,title,createdAt,updatedAt&limit=${limit}&offset=${offset}&orders=createdAt`;
    const res = await fetch(url, {
      headers: { "X-MICROCMS-API-KEY": API_KEY },
    });

    if (!res.ok) {
      console.error(`API エラー: ${res.status} ${res.statusText}`);
      process.exit(1);
    }

    const data = await res.json();
    allContents.push(...data.contents);

    if (allContents.length >= data.totalCount) break;
    offset += limit;
  }

  return allContents;
}

/**
 * 記事を削除
 */
async function deleteArticle(id) {
  const url = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/articles/${id}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { "X-MICROCMS-API-KEY": API_KEY },
  });

  return res.ok;
}

// --- メイン処理 ---

console.log("microCMS 重複記事チェック");
console.log(`  サービス: ${SERVICE_DOMAIN}`);
console.log(`  モード: ${shouldDelete ? "削除実行" : "ドライラン（確認のみ）"}`);
console.log(
  `  保持ルール: ${keepOlder ? "古い方を残す" : "新しい方を残す（デフォルト）"}`
);
console.log("");

const articles = await fetchAllArticles();
console.log(`  取得記事数: ${articles.length}`);
console.log("");

// slug ごとにグループ化
const slugMap = new Map();
for (const article of articles) {
  if (!slugMap.has(article.slug)) {
    slugMap.set(article.slug, []);
  }
  slugMap.get(article.slug).push(article);
}

// 重複を検出
const duplicates = [];
let uniqueCount = 0;

for (const [slug, items] of slugMap) {
  if (items.length === 1) {
    uniqueCount++;
    continue;
  }

  // 日時でソート（古い順）
  items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  console.log(`  重複: ${slug} (${items.length}件)`);
  for (const item of items) {
    const isKeep = keepOlder ? item === items[0] : item === items[items.length - 1];
    const label = isKeep ? "KEEP" : "DELETE";
    console.log(
      `    [${label}] id=${item.id}  created=${item.createdAt}  updated=${item.updatedAt}`
    );

    if (!isKeep) {
      duplicates.push(item);
    }
  }
}

console.log("");
console.log(`  ユニーク記事: ${uniqueCount}`);
console.log(`  重複スラッグ: ${slugMap.size - uniqueCount}`);
console.log(`  削除対象: ${duplicates.length}件`);
console.log(
  `  削除後の記事数: ${articles.length - duplicates.length}`
);
console.log("");

if (duplicates.length === 0) {
  console.log("重複はありません。");
  process.exit(0);
}

if (!shouldDelete) {
  console.log("ドライランのため削除は実行しません。");
  console.log(
    "実際に削除するには: MICROCMS_WRITE_KEY=xxxxx node scripts/dedupe-articles.mjs --delete"
  );
  process.exit(0);
}

// 削除実行
console.log("削除を実行します...");
console.log("");

let deleteCount = 0;
let errorCount = 0;

for (const article of duplicates) {
  const ok = await deleteArticle(article.id);
  if (ok) {
    deleteCount++;
    console.log(
      `  削除完了: ${article.slug} (id=${article.id})`
    );
  } else {
    errorCount++;
    console.error(
      `  削除失敗: ${article.slug} (id=${article.id})`
    );
  }

  // API レートリミット対策
  await new Promise((r) => setTimeout(r, 500));
}

console.log("");
console.log(`完了: ${deleteCount}件削除, ${errorCount}件エラー`);
console.log(
  `残り記事数: ${articles.length - deleteCount}`
);
