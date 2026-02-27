#!/usr/bin/env node

/**
 * YouTube Shorts アップロードスクリプト
 *
 * youtube-metadata.md をパースし、YouTube Data API v3 で動画をアップロードする。
 *
 * 使い方:
 *   node scripts/youtube-upload.mjs pickleball-rules              # 1本アップロード
 *   node scripts/youtube-upload.mjs --all                         # 全動画アップロード
 *   node scripts/youtube-upload.mjs pickleball-rules --dry-run    # アップロードせず確認のみ
 *   node scripts/youtube-upload.mjs --all --privacy private       # private でアップロード
 *   node scripts/youtube-upload.mjs --all --schedule 5h           # 5時間間隔で予約投稿
 *
 * オプション:
 *   --dry-run             アップロードせずメタデータを表示
 *   --all                 全動画を一括アップロード（5秒間隔）
 *   --privacy <value>     公開設定: unlisted (デフォルト), private, public
 *   --schedule <interval> 予約投稿の間隔（例: 5h, 30m）。1本目は即公開、2本目以降を予約
 *
 * クォータ:
 *   1回のアップロード = 約1,600 units
 *   日次上限 = 10,000 units → 最大6本/日
 */

import { readFile, writeFile } from "node:fs/promises";
import { existsSync, createReadStream } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { google } from "googleapis";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");

const CLIENT_SECRET_FILE = join(PROJECT_ROOT, ".youtube-client-secret.json");
const TOKEN_FILE = join(PROJECT_ROOT, ".youtube-token.json");
const VIDEOS_DIR = join(PROJECT_ROOT, "public", "videos");
const METADATA_FILE = join(VIDEOS_DIR, "youtube-metadata.md");

// --- メタデータパース ---

function parseMetadata(markdown) {
  const videos = [];
  // ## N. filename.mp4 で分割
  const sections = markdown.split(/^## \d+\.\s+/m).slice(1);

  for (const section of sections) {
    const lines = section.trim().split("\n");

    // ファイル名（最初の行）
    const fileMatch = lines[0].match(/^(\S+\.mp4)/);
    if (!fileMatch) continue;
    const filename = fileMatch[1];
    const slug = filename.replace(".mp4", "");

    // タイトル
    const titleMatch = section.match(/\*\*タイトル\*\*:\s*\n```\n([\s\S]*?)\n```/);
    const title = titleMatch ? titleMatch[1].trim() : "";

    // 説明文
    const descMatch = section.match(/\*\*説明文\*\*:\s*\n```\n([\s\S]*?)\n```/);
    const description = descMatch ? descMatch[1].trim() : "";

    // タグ
    const tagMatch = section.match(/\*\*タグ\*\*:\s*\n```\n([\s\S]*?)\n```/);
    const tags = tagMatch
      ? tagMatch[1].trim().split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    videos.push({ slug, filename, title, description, tags });
  }

  return videos;
}

// --- OAuth2クライアント ---

async function getAuthClient() {
  if (!existsSync(CLIENT_SECRET_FILE)) {
    console.error("エラー: .youtube-client-secret.json が見つかりません");
    console.error("先に node scripts/youtube-auth.mjs を実行してください。");
    process.exit(1);
  }

  if (!existsSync(TOKEN_FILE)) {
    console.error("エラー: .youtube-token.json が見つかりません");
    console.error("先に node scripts/youtube-auth.mjs を実行してください。");
    process.exit(1);
  }

  const secretContent = JSON.parse(await readFile(CLIENT_SECRET_FILE, "utf-8"));
  const credentials = secretContent.installed || secretContent.web;
  const tokens = JSON.parse(await readFile(TOKEN_FILE, "utf-8"));

  const oauth2Client = new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
  );

  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_type: tokens.token_type,
    expiry_date: tokens.expiry_date,
  });

  // トークンリフレッシュ時に自動保存
  oauth2Client.on("tokens", async (newTokens) => {
    const existing = JSON.parse(await readFile(TOKEN_FILE, "utf-8"));
    const updated = { ...existing, ...newTokens, obtained_at: Date.now() };
    await writeFile(TOKEN_FILE, JSON.stringify(updated, null, 2), "utf-8");
    console.log("トークンをリフレッシュしました。");
  });

  return oauth2Client;
}

// --- スケジュール解析 ---

function parseInterval(interval) {
  const match = interval.match(/^(\d+)(h|m)$/);
  if (!match) {
    console.error(`エラー: 不正な interval 値: ${interval}`);
    console.error("  例: 5h (5時間), 30m (30分)");
    process.exit(1);
  }
  const value = parseInt(match[1], 10);
  const unit = match[2];
  return unit === "h" ? value * 60 * 60 * 1000 : value * 60 * 1000;
}

// --- アップロード ---

async function uploadVideo(youtube, video, privacy, publishAt) {
  const filePath = join(VIDEOS_DIR, video.filename);

  if (!existsSync(filePath)) {
    throw new Error(`動画ファイルが見つかりません: ${filePath}`);
  }

  const status = {
    privacyStatus: publishAt ? "private" : privacy,
    selfDeclaredMadeForKids: false,
  };

  if (publishAt) {
    status.publishAt = publishAt.toISOString();
  }

  const res = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: video.title,
        description: video.description,
        tags: video.tags,
        categoryId: "22", // People & Blogs
        defaultLanguage: "ja",
        defaultAudioLanguage: "ja",
      },
      status,
    },
    media: {
      body: createReadStream(filePath),
    },
  });

  return res.data;
}

// --- メイン ---

async function main() {
  const args = process.argv.slice(2);

  // ヘルプ
  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    console.log("YouTube Shorts アップロードツール");
    console.log("");
    console.log("使い方:");
    console.log("  node scripts/youtube-upload.mjs <slug>              1本アップロード");
    console.log("  node scripts/youtube-upload.mjs --all               全動画アップロード");
    console.log("  node scripts/youtube-upload.mjs <slug> --dry-run    確認のみ");
    console.log("");
    console.log("オプション:");
    console.log("  --dry-run             アップロードせずメタデータを表示");
    console.log("  --all                 全動画を一括アップロード（5秒間隔）");
    console.log("  --privacy <value>     unlisted (デフォルト), private, public");
    console.log("  --schedule <interval> 予約投稿間隔（例: 5h）。1本目は即公開、2本目以降を予約");
    console.log("");
    console.log("利用可能な動画:");

    if (existsSync(METADATA_FILE)) {
      const md = await readFile(METADATA_FILE, "utf-8");
      const videos = parseMetadata(md);
      for (const v of videos) {
        const hasFile = existsSync(join(VIDEOS_DIR, v.filename)) ? "✓" : "✗";
        console.log(`  ${hasFile} ${v.slug}`);
      }
    }

    console.log("");
    console.log("クォータ: 1回 ≈ 1,600 units / 日上限 10,000 units = 最大6本/日");
    return;
  }

  // オプション解析
  const isDryRun = args.includes("--dry-run");
  const isAll = args.includes("--all");
  const privacyIndex = args.indexOf("--privacy");
  const privacy = privacyIndex !== -1 ? args[privacyIndex + 1] : "unlisted";
  const scheduleIndex = args.indexOf("--schedule");
  const scheduleInterval = scheduleIndex !== -1 ? parseInterval(args[scheduleIndex + 1]) : null;

  if (!["unlisted", "private", "public"].includes(privacy)) {
    console.error(`エラー: 不正な privacy 値: ${privacy}`);
    console.error("  unlisted, private, public のいずれかを指定してください。");
    process.exit(1);
  }

  // slug（--で始まらない最初の引数、オプション値を除外）
  const optionValues = new Set();
  if (privacyIndex !== -1) optionValues.add(args[privacyIndex + 1]);
  if (scheduleIndex !== -1) optionValues.add(args[scheduleIndex + 1]);
  const slug = args.find((a) => !a.startsWith("--") && !optionValues.has(a));

  if (!isAll && !slug) {
    console.error("エラー: 動画のslugまたは --all を指定してください。");
    process.exit(1);
  }

  // メタデータ読み込み
  if (!existsSync(METADATA_FILE)) {
    console.error(`エラー: ${METADATA_FILE} が見つかりません`);
    process.exit(1);
  }

  const md = await readFile(METADATA_FILE, "utf-8");
  const allVideos = parseMetadata(md);

  if (allVideos.length === 0) {
    console.error("エラー: メタデータから動画情報を抽出できませんでした。");
    process.exit(1);
  }

  // 対象動画を選定
  const targets = isAll
    ? allVideos
    : allVideos.filter((v) => v.slug === slug);

  if (targets.length === 0) {
    console.error(`エラー: 動画が見つかりません: ${slug}`);
    console.error("利用可能な動画:");
    for (const v of allVideos) {
      console.error(`  - ${v.slug}`);
    }
    process.exit(1);
  }

  // クォータ確認
  const estimatedUnits = targets.length * 1600;
  if (estimatedUnits > 10000) {
    console.warn(`警告: 推定クォータ使用量 ${estimatedUnits} units（日次上限 10,000 units）`);
    console.warn(`  ${targets.length}本中、最大6本までの分割アップロードを推奨します。`);
  }

  console.log("=".repeat(60));
  console.log(`YouTube Shorts アップロード${isDryRun ? "（DRY RUN）" : ""}`);
  console.log("=".repeat(60));
  console.log(`  対象: ${targets.length}本`);
  console.log(`  公開設定: ${privacy}${scheduleInterval ? "（1本目即公開 + 予約投稿）" : ""}`);
  if (scheduleInterval) {
    console.log(`  予約間隔: ${args[scheduleIndex + 1]}`);
  }
  console.log(`  推定クォータ: ${estimatedUnits} / 10,000 units`);
  console.log("");

  // Dry run: メタデータ表示のみ
  if (isDryRun) {
    const now = new Date();
    for (let i = 0; i < targets.length; i++) {
      const video = targets[i];
      const filePath = join(VIDEOS_DIR, video.filename);
      const fileExists = existsSync(filePath);

      const publishAt = scheduleInterval && i > 0
        ? new Date(now.getTime() + scheduleInterval * i)
        : null;

      console.log(`--- ${video.slug} ---`);
      console.log(`  ファイル: ${video.filename} ${fileExists ? "✓" : "✗ (見つかりません)"}`);
      console.log(`  タイトル: ${video.title}`);
      if (publishAt) {
        console.log(`  予約公開: ${publishAt.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })} (JST)`);
      } else if (scheduleInterval) {
        console.log(`  公開: 即時 (${privacy})`);
      }
      console.log(`  タグ: ${video.tags.join(", ")}`);
      console.log(`  説明文:`);
      for (const line of video.description.split("\n").slice(0, 5)) {
        console.log(`    ${line}`);
      }
      if (video.description.split("\n").length > 5) {
        console.log(`    ... (${video.description.split("\n").length}行)`);
      }
      console.log("");
    }

    console.log("=".repeat(60));
    console.log("DRY RUN 完了。実際にアップロードするには --dry-run を外してください。");
    console.log("=".repeat(60));
    return;
  }

  // 実アップロード
  const auth = await getAuthClient();
  const youtube = google.youtube({ version: "v3", auth });
  const now = new Date();

  let success = 0;
  let fail = 0;

  for (let i = 0; i < targets.length; i++) {
    const video = targets[i];
    const filePath = join(VIDEOS_DIR, video.filename);

    const publishAt = scheduleInterval && i > 0
      ? new Date(now.getTime() + scheduleInterval * i)
      : null;

    console.log(`[${i + 1}/${targets.length}] ${video.slug}`);
    console.log(`  タイトル: ${video.title}`);
    if (publishAt) {
      console.log(`  予約公開: ${publishAt.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })} (JST)`);
    }

    if (!existsSync(filePath)) {
      console.error(`  スキップ: ファイルが見つかりません`);
      fail++;
      continue;
    }

    try {
      const result = await uploadVideo(youtube, video, privacy, publishAt);
      console.log(`  アップロード成功!`);
      console.log(`  Video ID: ${result.id}`);
      console.log(`  URL: https://youtube.com/shorts/${result.id}`);
      success++;
    } catch (error) {
      const message = error.response?.data?.error?.message || error.message;
      console.error(`  アップロード失敗: ${message}`);

      // クォータ超過の場合は中断
      if (error.response?.status === 403 && message.includes("quota")) {
        console.error("");
        console.error("クォータ上限に達しました。明日再実行してください。");
        break;
      }
      fail++;
    }

    // 複数アップロード時は5秒間隔
    if (i < targets.length - 1) {
      console.log("  5秒待機中...");
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  console.log("");
  console.log("=".repeat(60));
  console.log(`完了: ${success}件成功, ${fail}件失敗`);
  console.log("=".repeat(60));

  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(`エラー: ${err.message}`);
  process.exit(1);
});
