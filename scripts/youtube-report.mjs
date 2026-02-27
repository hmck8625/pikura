#!/usr/bin/env node

/**
 * YouTube Analytics レポート生成スクリプト
 *
 * YouTube Analytics API からデータを取得し、Markdownレポートを出力する。
 *
 * 事前準備:
 *   node scripts/analytics-auth.mjs（初回のみ）
 *
 * 使い方:
 *   node scripts/youtube-report.mjs                 # 直近28日間
 *   node scripts/youtube-report.mjs --days 7        # 直近7日間
 */

import { readFile, writeFile } from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { google } from "googleapis";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");

const TOKEN_FILE = join(PROJECT_ROOT, ".google-analytics-token.json");
const CLIENT_SECRET_FILE = join(PROJECT_ROOT, ".youtube-client-secret.json");

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

  oauth2Client.on("tokens", async (newTokens) => {
    const updated = { ...token, ...newTokens };
    await writeFile(TOKEN_FILE, JSON.stringify(updated, null, 2), "utf-8");
  });

  return oauth2Client;
}

async function getChannelId(auth) {
  const youtube = google.youtube({ version: "v3", auth });
  const res = await youtube.channels.list({
    part: "snippet,statistics",
    mine: true,
  });
  const channel = res.data.items?.[0];
  return channel || null;
}

async function getVideoList(auth) {
  const youtube = google.youtube({ version: "v3", auth });

  // 自分のチャンネルのアップロード動画を取得
  const channelRes = await youtube.channels.list({
    part: "contentDetails",
    mine: true,
  });

  const uploadsPlaylistId = channelRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) return [];

  const playlistRes = await youtube.playlistItems.list({
    part: "snippet,contentDetails",
    playlistId: uploadsPlaylistId,
    maxResults: 50,
  });

  return (playlistRes.data.items || []).map((item) => ({
    videoId: item.contentDetails.videoId,
    title: item.snippet.title,
    publishedAt: item.snippet.publishedAt,
    thumbnail: item.snippet.thumbnails?.default?.url,
  }));
}

async function getVideoStats(auth, videoIds) {
  if (videoIds.length === 0) return [];

  const youtube = google.youtube({ version: "v3", auth });
  const res = await youtube.videos.list({
    part: "statistics,contentDetails",
    id: videoIds.join(","),
  });

  return res.data.items || [];
}

async function getAnalyticsReport(auth, startDate, endDate) {
  const youtubeAnalytics = google.youtubeAnalytics({ version: "v2", auth });

  try {
    // チャンネル全体の日別データ
    const dailyRes = await youtubeAnalytics.reports.query({
      ids: "channel==MINE",
      startDate,
      endDate,
      metrics: "views,estimatedMinutesWatched,subscribersGained,subscribersLost,likes",
      dimensions: "day",
      sort: "day",
    });

    // 動画別データ
    const videoRes = await youtubeAnalytics.reports.query({
      ids: "channel==MINE",
      startDate,
      endDate,
      metrics: "views,estimatedMinutesWatched,averageViewDuration,likes",
      dimensions: "video",
      sort: "-views",
      maxResults: 25,
    });

    // トラフィックソース
    const trafficRes = await youtubeAnalytics.reports.query({
      ids: "channel==MINE",
      startDate,
      endDate,
      metrics: "views,estimatedMinutesWatched",
      dimensions: "insightTrafficSourceType",
      sort: "-views",
    });

    return {
      daily: dailyRes.data.rows || [],
      videos: videoRes.data.rows || [],
      traffic: trafficRes.data.rows || [],
    };
  } catch (err) {
    console.warn(`Analytics APIエラー: ${err.message}`);
    console.warn("YouTube Analytics APIが有効化されているか確認してください。");
    return { daily: [], videos: [], traffic: [] };
  }
}

function generateReport(channel, videos, videoStats, analytics, startDate, endDate) {
  let md = `# YouTube Analytics レポート

**チャンネル**: ${channel?.snippet?.title || "不明"}
**登録者数**: ${channel?.statistics?.subscriberCount || "不明"}
**総動画数**: ${channel?.statistics?.videoCount || "不明"}
**総再生回数**: ${channel?.statistics?.viewCount || "不明"}
**期間**: ${startDate} 〜 ${endDate}
**生成日時**: ${new Date().toISOString()}

---

## チャンネルサマリー

| 指標 | 値 |
|------|-----|
| 登録者数 | ${channel?.statistics?.subscriberCount || "—"} |
| 総再生回数 | ${channel?.statistics?.viewCount || "—"} |
| 総動画数 | ${channel?.statistics?.videoCount || "—"} |

`;

  // 動画一覧（Data API）
  if (videos.length > 0) {
    const statsMap = new Map();
    for (const vs of videoStats) {
      statsMap.set(vs.id, vs.statistics);
    }

    md += `## アップロード動画一覧\n\n`;
    md += `| # | タイトル | 公開日 | 再生数 | いいね | コメント |\n`;
    md += `|---|---------|--------|--------|--------|----------|\n`;

    videos.forEach((v, i) => {
      const stats = statsMap.get(v.videoId) || {};
      const pubDate = v.publishedAt?.split("T")[0] || "—";
      md += `| ${i + 1} | ${v.title} | ${pubDate} | ${stats.viewCount || 0} | ${stats.likeCount || 0} | ${stats.commentCount || 0} |\n`;
    });
    md += "\n";
  }

  // Analytics: 日別トレンド
  if (analytics.daily.length > 0) {
    const totalViews = analytics.daily.reduce((s, r) => s + (r[1] || 0), 0);
    const totalMinutes = analytics.daily.reduce((s, r) => s + (r[2] || 0), 0);
    const totalSubGained = analytics.daily.reduce((s, r) => s + (r[3] || 0), 0);
    const totalSubLost = analytics.daily.reduce((s, r) => s + (r[4] || 0), 0);

    md += `## 期間内パフォーマンス\n\n`;
    md += `| 指標 | 値 |\n`;
    md += `|------|-----|\n`;
    md += `| 再生回数 | ${totalViews} |\n`;
    md += `| 視聴時間（分） | ${totalMinutes.toFixed(1)} |\n`;
    md += `| 登録者増 | +${totalSubGained} |\n`;
    md += `| 登録者減 | -${totalSubLost} |\n`;
    md += `| 純登録者増減 | ${totalSubGained - totalSubLost >= 0 ? "+" : ""}${totalSubGained - totalSubLost} |\n\n`;

    md += `### 日別トレンド\n\n`;
    md += `| 日付 | 再生 | 視聴時間(分) | 登録者増 | いいね |\n`;
    md += `|------|------|-------------|---------|--------|\n`;
    for (const row of analytics.daily) {
      md += `| ${row[0]} | ${row[1]} | ${(row[2] || 0).toFixed(1)} | ${row[3] || 0} | ${row[5] || 0} |\n`;
    }
    md += "\n";
  }

  // Analytics: トラフィックソース
  if (analytics.traffic.length > 0) {
    const trafficLabels = {
      EXT_URL: "外部サイト",
      NO_LINK_OTHER: "その他",
      NOTIFICATION: "通知",
      RELATED_VIDEO: "関連動画",
      SUBSCRIBER: "登録者フィード",
      YT_CHANNEL: "チャンネルページ",
      YT_OTHER_PAGE: "YouTubeその他",
      YT_PLAYLIST_PAGE: "プレイリスト",
      YT_SEARCH: "YouTube検索",
      SHORTS: "ショート",
    };

    md += `## トラフィックソース\n\n`;
    md += `| ソース | 再生数 | 視聴時間(分) |\n`;
    md += `|--------|--------|-------------|\n`;
    for (const row of analytics.traffic) {
      const label = trafficLabels[row[0]] || row[0];
      md += `| ${label} | ${row[1]} | ${(row[2] || 0).toFixed(1)} |\n`;
    }
    md += "\n";
  }

  // AI向け分析セクション
  md += `---

## AI分析用メモ

### データの解釈ポイント
- 再生回数が低い場合: サムネイル・タイトルの改善、投稿時間の最適化を検討
- 平均視聴時間が短い場合: 冒頭のフック（最初の3秒）が弱い可能性
- YouTube検索からの流入が少ない場合: タイトル・概要欄のキーワード最適化が必要
- 外部サイトからの流入がある場合: pikura.appの記事埋め込み効果
- ショートからの流入割合を確認: Shorts最適化の効果測定

### pikura.app の想定YouTube戦略
- ショート動画でピックルボールの認知を拡大
- 記事とショート動画の相互リンクでトラフィックを循環
- あるあるネタTシャツの露出チャネルとして活用
`;

  return md;
}

async function main() {
  console.log("YouTube Analytics レポート生成");
  console.log("=".repeat(50));

  const days = parseInt(getArg("days") || "28", 10);
  const endDate = formatDate(new Date());
  const startDate = formatDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000));

  console.log(`期間: ${startDate} 〜 ${endDate}`);
  console.log("");

  const auth = await getAuthClient();

  console.log("データ取得中...");

  // Data API（動画リスト・統計）は youtube.readonly スコープで取得可能
  const channel = await getChannelId(auth).catch(() => null);
  console.log(`  チャンネル: ${channel?.snippet?.title || "取得失敗"}`);

  const videos = await getVideoList(auth).catch(() => []);
  console.log(`  動画数: ${videos.length}`);

  const videoIds = videos.map((v) => v.videoId);
  const videoStats = await getVideoStats(auth, videoIds).catch(() => []);

  // Analytics API
  const analytics = await getAnalyticsReport(auth, startDate, endDate);
  console.log(`  日別データ: ${analytics.daily.length}件`);
  console.log(`  トラフィック: ${analytics.traffic.length}件`);

  const report = generateReport(channel, videos, videoStats, analytics, startDate, endDate);

  // レポート出力
  const outputDir = join(PROJECT_ROOT, "..", "reports");
  mkdirSync(outputDir, { recursive: true });
  const outputPath = join(outputDir, `youtube-report-${endDate}.md`);
  await writeFile(outputPath, report, "utf-8");

  console.log("");
  console.log(`レポート出力: ${outputPath}`);
  console.log("=".repeat(50));
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
