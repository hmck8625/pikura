#!/usr/bin/env node

/**
 * Google Search Console レポート生成スクリプト
 *
 * GSC APIからデータを取得し、Markdownレポートを出力する。
 *
 * 事前準備:
 *   node scripts/analytics-auth.mjs（初回のみ）
 *
 * 使い方:
 *   node scripts/gsc-report.mjs                    # 直近28日間
 *   node scripts/gsc-report.mjs --days 7           # 直近7日間
 *   node scripts/gsc-report.mjs --start 2026-02-01 --end 2026-02-28
 */

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { google } from "googleapis";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");

const TOKEN_FILE = join(PROJECT_ROOT, ".google-analytics-token.json");
const CLIENT_SECRET_FILE = join(PROJECT_ROOT, ".youtube-client-secret.json");
const SITE_URL = "https://pikura.app";

// 引数パース
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

async function getAuthClient() {
  if (!existsSync(TOKEN_FILE)) {
    console.error("エラー: .google-analytics-token.json が見つかりません");
    console.error("先に認証を実行してください: node scripts/analytics-auth.mjs");
    process.exit(1);
  }

  const token = JSON.parse(await readFile(TOKEN_FILE, "utf-8"));
  const secret = JSON.parse(await readFile(CLIENT_SECRET_FILE, "utf-8"));
  const creds = secret.installed || secret.web;

  const oauth2Client = new google.auth.OAuth2(
    creds.client_id,
    creds.client_secret,
    token.redirect_uri
  );

  oauth2Client.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expiry_date: token.expiry_date,
  });

  // トークンリフレッシュ時に保存
  oauth2Client.on("tokens", async (newTokens) => {
    const updated = { ...token, ...newTokens };
    await writeFile(TOKEN_FILE, JSON.stringify(updated, null, 2), "utf-8");
  });

  return oauth2Client;
}

async function fetchSearchAnalytics(auth, startDate, endDate, dimensions, rowLimit = 25) {
  const searchconsole = google.searchconsole({ version: "v1", auth });

  const res = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions,
      rowLimit,
    },
  });

  return res.data.rows || [];
}

async function fetchIndexStatus(auth) {
  const searchconsole = google.searchconsole({ version: "v1", auth });

  // サイトマップからインデックス状況を確認
  try {
    const res = await searchconsole.sitemaps.list({ siteUrl: SITE_URL });
    return res.data.sitemap || [];
  } catch {
    return [];
  }
}

function generateReport(data, startDate, endDate) {
  const { queries, pages, devices, dates, sitemaps } = data;

  // サマリー計算
  const totalClicks = queries.reduce((sum, r) => sum + (r.clicks || 0), 0);
  const totalImpressions = queries.reduce((sum, r) => sum + (r.impressions || 0), 0);
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : "0.00";
  const avgPosition = queries.length > 0
    ? (queries.reduce((sum, r) => sum + (r.position || 0), 0) / queries.length).toFixed(1)
    : "—";

  let md = `# Google Search Console レポート

**サイト**: ${SITE_URL}
**期間**: ${startDate} 〜 ${endDate}
**生成日時**: ${new Date().toISOString()}

---

## サマリー

| 指標 | 値 |
|------|-----|
| 合計クリック | ${totalClicks} |
| 合計インプレッション | ${totalImpressions} |
| 平均CTR | ${avgCtr}% |
| 平均掲載順位 | ${avgPosition} |

`;

  // サイトマップ
  if (sitemaps.length > 0) {
    md += `## サイトマップ状況\n\n`;
    md += `| サイトマップ | ステータス | 送信URL数 | 最終送信日 |\n`;
    md += `|-------------|----------|----------|----------|\n`;
    for (const sm of sitemaps) {
      md += `| ${sm.path || "—"} | ${sm.lastSubmitted ? "送信済" : "未送信"} | ${sm.contents?.[0]?.submitted || "—"} | ${sm.lastSubmitted || "—"} |\n`;
    }
    md += "\n";
  }

  // クエリ
  if (queries.length > 0) {
    md += `## 検索クエリ TOP ${queries.length}（インプレッション順）\n\n`;
    md += `| # | クエリ | imp | click | CTR | 順位 |\n`;
    md += `|---|--------|-----|-------|-----|------|\n`;
    queries.forEach((r, i) => {
      const q = r.keys[0];
      const ctr = r.impressions > 0 ? (r.clicks / r.impressions * 100).toFixed(1) : "0";
      md += `| ${i + 1} | ${q} | ${r.impressions} | ${r.clicks} | ${ctr}% | ${r.position.toFixed(1)} |\n`;
    });
    md += "\n";
  } else {
    md += `## 検索クエリ\n\nデータなし（インデックスが進んでいない可能性があります）\n\n`;
  }

  // ページ
  if (pages.length > 0) {
    md += `## ページ別 TOP ${pages.length}（インプレッション順）\n\n`;
    md += `| # | ページ | imp | click | CTR |\n`;
    md += `|---|--------|-----|-------|-----|\n`;
    pages.forEach((r, i) => {
      const url = r.keys[0].replace(SITE_URL, "");
      const ctr = r.impressions > 0 ? (r.clicks / r.impressions * 100).toFixed(1) : "0";
      md += `| ${i + 1} | ${url || "/"} | ${r.impressions} | ${r.clicks} | ${ctr}% |\n`;
    });
    md += "\n";
  }

  // デバイス
  if (devices.length > 0) {
    md += `## デバイス分布\n\n`;
    md += `| デバイス | imp | click | CTR |\n`;
    md += `|---------|-----|-------|-----|\n`;
    for (const r of devices) {
      const ctr = r.impressions > 0 ? (r.clicks / r.impressions * 100).toFixed(1) : "0";
      md += `| ${r.keys[0]} | ${r.impressions} | ${r.clicks} | ${ctr}% |\n`;
    }
    md += "\n";
  }

  // 日別トレンド
  if (dates.length > 0) {
    md += `## 日別トレンド\n\n`;
    md += `| 日付 | imp | click |\n`;
    md += `|------|-----|-------|\n`;
    for (const r of dates) {
      md += `| ${r.keys[0]} | ${r.impressions} | ${r.clicks} |\n`;
    }
    md += "\n";
  }

  // AI向け分析セクション
  md += `---

## AI分析用メモ

### データの解釈ポイント
- インプレッションが0の場合: Googleのインデックスがまだ進んでいない。sitemap.xml送信確認が必要。
- インプレッションはあるがクリックが0の場合: タイトル・descriptionの改善が必要。
- 順位が10以下（2ページ目以降）: コンテンツの充実化・被リンク獲得が必要。
- 特定クエリで順位が高い場合: そのキーワードを軸に関連コンテンツを増やすチャンス。

### pikura.app の想定検索キーワード
- 「ピックルボール ランキング」「JPA ランキング」
- 「ピックルボール 大会」「ピックルボール イベント」
- 「ピックルボール パドル おすすめ」
- 「ピックルボール ルール」「ピックルボール 始め方」
- 「船水雄太 ピックルボール」
- 「ピックルボール Tシャツ」
`;

  return md;
}

async function main() {
  console.log("Google Search Console レポート生成");
  console.log("=".repeat(50));

  const days = parseInt(getArg("days") || "28", 10);
  const endDate = getArg("end") || formatDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)); // GSCは2日前まで
  const startDate = getArg("start") || formatDate(new Date(new Date(endDate).getTime() - days * 24 * 60 * 60 * 1000));

  console.log(`期間: ${startDate} 〜 ${endDate}`);
  console.log("");

  const auth = await getAuthClient();

  console.log("データ取得中...");

  const [queries, pages, devices, dates, sitemaps] = await Promise.all([
    fetchSearchAnalytics(auth, startDate, endDate, ["query"], 50).catch(() => []),
    fetchSearchAnalytics(auth, startDate, endDate, ["page"], 50).catch(() => []),
    fetchSearchAnalytics(auth, startDate, endDate, ["device"], 10).catch(() => []),
    fetchSearchAnalytics(auth, startDate, endDate, ["date"], 90).catch(() => []),
    fetchIndexStatus(auth).catch(() => []),
  ]);

  console.log(`  クエリ: ${queries.length}件`);
  console.log(`  ページ: ${pages.length}件`);
  console.log(`  デバイス: ${devices.length}件`);
  console.log(`  日別: ${dates.length}件`);

  const report = generateReport(
    { queries, pages, devices, dates, sitemaps },
    startDate,
    endDate
  );

  // レポート出力
  const outputPath = join(PROJECT_ROOT, "..", "reports", `gsc-report-${endDate}.md`);
  const outputDir = join(PROJECT_ROOT, "..", "reports");

  // reportsディレクトリがなければ作成
  const { mkdirSync } = await import("node:fs");
  mkdirSync(outputDir, { recursive: true });

  await writeFile(outputPath, report, "utf-8");

  console.log("");
  console.log(`レポート出力: ${outputPath}`);
  console.log("=".repeat(50));

  // stdoutにも出力（AI分析用）
  console.log("");
  console.log(report);
}

main().catch((err) => {
  console.error(`エラー: ${err.message}`);
  if (err.message.includes("invalid_grant") || err.message.includes("Token")) {
    console.error("トークンが期限切れです。再認証してください: node scripts/analytics-auth.mjs");
  }
  process.exit(1);
});
