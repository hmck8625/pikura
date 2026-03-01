/**
 * ツイート予約投稿スクリプト
 *
 * Gemini APIでツイートを一括生成し、日中に2〜3時間おきで自動投稿する。
 * バックグラウンドで実行し続ける必要あり。
 *
 * 使い方:
 *   source .env.local && node scripts/schedule-tweets.mjs                     # デフォルト（9,11:30,14,16:30,19時）
 *   source .env.local && node scripts/schedule-tweets.mjs --times "9,12,15,18,21"  # カスタム時間
 *   source .env.local && node scripts/schedule-tweets.mjs --dry-run           # プレビューのみ
 *   source .env.local && nohup node scripts/schedule-tweets.mjs &             # バックグラウンド実行
 *
 * 環境変数:
 *   GEMINI_API_KEY, X_CONSUMER_KEY, X_CONSUMER_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { postTweet } from "./post-tweet.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HISTORY_PATH = resolve(__dirname, ".tweet-history.json");
const SCHEDULE_PATH = resolve(__dirname, ".tweet-schedule.json");

// デフォルトの投稿時間（JST、24時間表記）
const DEFAULT_TIMES = [9, 11.5, 14, 16.5, 19];

// ---------------------------------------------------------------------------
// 記事・選手データ
// ---------------------------------------------------------------------------
const ARTICLES = [
  { slug: "what-is-pickleball", title: "ピックルボールとは？初心者向け完全ガイド" },
  { slug: "how-to-start-pickleball", title: "ピックルボールの始め方" },
  { slug: "pickleball-rules", title: "ピックルボールのルール完全解説" },
  { slug: "paddle-guide", title: "パドルおすすめ10選" },
  { slug: "tokyo-pickleball-courts", title: "東京でピックルボールができる場所まとめ" },
  { slug: "doubles-tactics", title: "ダブルス戦術ガイド" },
  { slug: "court-size-setup", title: "コートのサイズ・寸法と設営方法" },
  { slug: "shoes-guide", title: "シューズおすすめ8選" },
  { slug: "first-tournament-guide", title: "初めてのピックルボール大会参加ガイド" },
  { slug: "jpa-ranking-explained", title: "JPA公式ランキングの仕組み" },
  { slug: "serve-basics", title: "ピックルボールのサーブ基本3種類" },
  { slug: "dink-basics", title: "ディンクとは？30秒解説" },
  { slug: "pickleball-vs-tennis", title: "ピックルボール vs テニス 5つの違い" },
  { slug: "dupr-japan", title: "DUPRって何？日本で使えるの？" },
  { slug: "third-shot-drop", title: "3rdショットドロップ 初心者向け" },
  { slug: "doubles-position", title: "ダブルスの基本ポジション" },
  { slug: "osaka-pickleball", title: "大阪でピックルボールできる場所TOP3" },
  { slug: "app-japan-open", title: "APP JAPAN Open ハイライト" },
  { slug: "kitchen-rule-simple", title: "キッチンルール これだけ覚えればOK" },
  { slug: "kitchen-rules", title: "キッチンルール完全ガイド" },
];

const TOP_PLAYERS = [
  { name: "東村 大祐", category: "男子シングルス", rank: 1, points: 68 },
  { name: "Tomoki Kajiyama", category: "男子ダブルス", rank: 1, points: 270 },
  { name: "Hiroki Tanimura", category: "男子シングルス", rank: 2, points: 61 },
  { name: "Yohei Koide", category: "男子シングルス 35+", rank: 1, points: 38 },
];

const SITE_URL = "https://pikura.app";

// ---------------------------------------------------------------------------
// ヘルパー
// ---------------------------------------------------------------------------
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function jstNow() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}

function formatJST(date) {
  const h = String(date.getUTCHours()).padStart(2, "0");
  const m = String(date.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function timeToMs(hour) {
  // hour は小数可（例: 11.5 = 11:30）
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  const now = jstNow();
  const target = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    h, m, 0, 0
  ));
  // JST→UTC: JSTのh時 = UTCの(h-9)時
  target.setUTCHours(target.getUTCHours() - 9);
  return target.getTime();
}

function formatHour(hour) {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// 投稿履歴
// ---------------------------------------------------------------------------
function loadHistory() {
  if (!existsSync(HISTORY_PATH)) return [];
  try {
    return JSON.parse(readFileSync(HISTORY_PATH, "utf-8"));
  } catch {
    return [];
  }
}

function saveHistory(entry) {
  const history = loadHistory();
  history.push(entry);
  const trimmed = history.slice(-100);
  writeFileSync(HISTORY_PATH, JSON.stringify(trimmed, null, 2));
}

// ---------------------------------------------------------------------------
// スケジュール永続化（中断からの再開用）
// ---------------------------------------------------------------------------
function saveSchedule(schedule) {
  writeFileSync(SCHEDULE_PATH, JSON.stringify(schedule, null, 2));
}

function loadSchedule() {
  if (!existsSync(SCHEDULE_PATH)) return null;
  try {
    return JSON.parse(readFileSync(SCHEDULE_PATH, "utf-8"));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Gemini API でツイート一括生成
// ---------------------------------------------------------------------------
async function generateBatchTweets(count) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY が未設定です");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  // 各ツイートに異なる記事・選手を割り当て
  const selectedArticles = [];
  const availableArticles = [...ARTICLES];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * availableArticles.length);
    selectedArticles.push(availableArticles.splice(idx, 1)[0] || pickRandom(ARTICLES));
  }

  const categories = [
    "記事紹介",
    "ルール豆知識",
    "ランキング紹介",
    "コミュニティ",
    "大会情報",
    "記事紹介",
    "ルール豆知識",
  ];

  const tweetSpecs = selectedArticles.map((article, i) => {
    const cat = categories[i % categories.length];
    const player = pickRandom(TOP_PLAYERS);
    const articleUrl = `${SITE_URL}/articles/${article.slug}`;

    if (cat === "記事紹介") {
      return `${i + 1}. [${cat}] 記事「${article.title}」を紹介。URL: ${articleUrl}`;
    } else if (cat === "ランキング紹介") {
      return `${i + 1}. [${cat}] ${player.name}（${player.category} ${player.rank}位、${player.points}pt）を紹介。URL: ${SITE_URL}/ranking`;
    } else if (cat === "ルール豆知識") {
      return `${i + 1}. [${cat}] 「知ってた？」で始まるピックルボールルール豆知識`;
    } else if (cat === "コミュニティ") {
      return `${i + 1}. [${cat}] 質問形式でフォロワーの返信を促す`;
    } else {
      return `${i + 1}. [${cat}] 大会参加を促す。参考: ${SITE_URL}/articles/first-tournament-guide`;
    }
  });

  const prompt = `
あなたは日本のピックルボール総合メディア「pikura」(@pikura_app) のSNS担当です。
以下の指示に従って、${count}本のツイートを生成してください。

【制約】
- 各ツイートは日本語で140文字以内（ハッシュタグ込み）
- 必ず末尾に #ピックルボール を付ける
- 絵文字は1〜2個まで自然に使う
- 宣伝臭くなく、読みたくなる自然な口調で
- ${count}本それぞれ内容が被らないようにする
- URLが指定されている場合は必ず含める

【${count}本の指示】
${tweetSpecs.join("\n")}

【出力フォーマット】
番号付きで出力。余計な説明は不要:

1. ツイート本文
2. ツイート本文
...
`.trim();

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      console.log(`  リトライ中... (${attempt}/2)`);
      await sleep(3000);
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{
              text: "ピックルボール専門メディアのSNS運用担当。カジュアルだけど信頼感のあるトーンで。",
            }],
          },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 1.0, maxOutputTokens: 4096 },
        }),
      });

      if (!res.ok) {
        console.error(`  Gemini API エラー (${res.status})`);
        continue;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;

      // パース: "1. ツイート本文" or "1.ツイート本文"
      const tweets = [];
      const blocks = text.trim().split(/\n\s*\n|\n(?=\d+\.)/);

      for (const block of blocks) {
        const cleaned = block.trim();
        const match = cleaned.match(/^\d+\.\s*(.+)/s);
        if (match) {
          const tweetText = match[1].replace(/\n/g, "").trim();
          if (tweetText.length > 0 && tweetText.length <= 280) {
            tweets.push(tweetText);
          }
        }
      }

      if (tweets.length >= count) return tweets.slice(0, count);
      if (tweets.length > 0) return tweets;

      console.error(`  パース失敗（${tweets.length}/${count}本）`);
    } catch (error) {
      console.error(`  エラー: ${error.message}`);
    }
  }

  throw new Error("ツイート生成に失敗しました");
}

// ---------------------------------------------------------------------------
// メイン処理
// ---------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  // --times "9,12,15,18,21" でカスタム時間指定
  let times = DEFAULT_TIMES;
  const timesIdx = args.indexOf("--times");
  if (timesIdx !== -1 && args[timesIdx + 1]) {
    times = args[timesIdx + 1].split(",").map((t) => parseFloat(t.trim()));
  }

  // 環境変数チェック
  if (!dryRun) {
    const required = ["X_CONSUMER_KEY", "X_CONSUMER_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET"];
    const missing = required.filter((k) => !process.env[k]);
    if (missing.length > 0) {
      console.error("X API 環境変数が未設定:", missing.join(", "));
      process.exit(1);
    }
  }

  const now = Date.now();
  // 今日の残りのスロットのみフィルター
  const futureTimes = times.filter((t) => timeToMs(t) > now + 60 * 1000);

  if (futureTimes.length === 0) {
    console.error("今日の予約可能な時間スロットがありません。");
    console.error(`  設定時間(JST): ${times.map(formatHour).join(", ")}`);
    console.error(`  現在時刻(JST): ${formatJST(jstNow())}`);
    console.error("");
    console.error("明日の分をセットするには、朝に再実行してください。");
    process.exit(1);
  }

  console.log("pikura 予約ツイート");
  console.log("=".repeat(50));
  console.log(`  現在時刻(JST): ${formatJST(jstNow())}`);
  console.log(`  予約スロット: ${futureTimes.length}本`);
  console.log(`  投稿時間: ${futureTimes.map(formatHour).join(", ")}`);
  console.log("=".repeat(50));
  console.log("");

  // Step 1: ツイート一括生成
  console.log(`Gemini 2.5 Flash で ${futureTimes.length} 本のツイートを生成中...`);
  console.log("");

  const tweets = await generateBatchTweets(futureTimes.length);

  // スケジュール構築
  const schedule = futureTimes.map((time, i) => ({
    time: formatHour(time),
    timestampMs: timeToMs(time),
    tweet: tweets[i],
    status: "pending",
  }));

  // 表示
  console.log("-".repeat(50));
  console.log("予約スケジュール:");
  console.log("-".repeat(50));
  console.log("");

  for (const slot of schedule) {
    console.log(`  ${slot.time}  ${slot.tweet}`);
    console.log(`          (${slot.tweet.length}文字)`);
    console.log("");
  }

  if (dryRun) {
    console.log("--- DRY RUN 完了（投稿はスキップ）---");
    return;
  }

  // スケジュール保存
  saveSchedule(schedule);
  console.log("スケジュールを保存しました。投稿待機中...");
  console.log("（Ctrl+C で中断。次回実行時は未投稿分から再開）");
  console.log("");

  // Step 2: 時間が来たら投稿
  for (let i = 0; i < schedule.length; i++) {
    const slot = schedule[i];

    if (slot.status === "posted") continue;

    const waitMs = slot.timestampMs - Date.now();
    if (waitMs > 0) {
      const waitMin = Math.round(waitMs / 60000);
      console.log(`  [${slot.time}] ${waitMin}分後に投稿予定...`);

      // 1分ごとにハートビート表示
      let remaining = waitMs;
      while (remaining > 0) {
        const chunk = Math.min(remaining, 60 * 1000);
        await sleep(chunk);
        remaining -= chunk;
      }
    }

    // 投稿
    console.log(`  [${slot.time}] 投稿中...`);
    try {
      const result = await postTweet(slot.tweet);
      slot.status = "posted";
      slot.tweetId = result.id;
      slot.url = result.url;
      saveSchedule(schedule);

      saveHistory({
        date: new Date().toISOString(),
        category: "scheduled",
        text: slot.tweet,
        tweetId: result.id,
        url: result.url,
      });

      console.log(`  [${slot.time}] 投稿完了: ${result.url}`);
      console.log("");
    } catch (error) {
      console.error(`  [${slot.time}] 投稿失敗: ${error.message}`);
      slot.status = "failed";
      slot.error = error.message;
      saveSchedule(schedule);
    }
  }

  console.log("=".repeat(50));
  console.log("全予約ツイートの処理が完了しました。");
  const posted = schedule.filter((s) => s.status === "posted").length;
  const failed = schedule.filter((s) => s.status === "failed").length;
  console.log(`  成功: ${posted} / 失敗: ${failed}`);
  console.log("=".repeat(50));
}

main().catch((error) => {
  console.error(`致命的エラー: ${error.message}`);
  process.exit(1);
});
