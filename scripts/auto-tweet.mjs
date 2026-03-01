/**
 * ツイート生成→選択→投稿 統合スクリプト
 *
 * Gemini APIでツイート候補を生成し、対話的に選んで投稿する。
 *
 * 使い方:
 *   source .env.local && node scripts/auto-tweet.mjs              # 5候補生成→選択→投稿
 *   source .env.local && node scripts/auto-tweet.mjs --auto       # 5候補生成→ランダム1つを自動投稿
 *   source .env.local && node scripts/auto-tweet.mjs --dry-run    # 生成のみ、投稿しない
 *
 * 環境変数:
 *   GEMINI_API_KEY（ツイート生成）
 *   X_CONSUMER_KEY, X_CONSUMER_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET（投稿時）
 */

import { createInterface } from "readline";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { postTweet } from "./post-tweet.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HISTORY_PATH = resolve(__dirname, ".tweet-history.json");

// ---------------------------------------------------------------------------
// 記事データ
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

function askQuestion(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ---------------------------------------------------------------------------
// 投稿履歴管理
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
  // 直近100件のみ保持
  const trimmed = history.slice(-100);
  writeFileSync(HISTORY_PATH, JSON.stringify(trimmed, null, 2));
}

// ---------------------------------------------------------------------------
// Gemini APIでツイート生成
// ---------------------------------------------------------------------------
function buildPrompt() {
  const player = pickRandom(TOP_PLAYERS);
  const article = pickRandom(ARTICLES);
  const articleUrl = `${SITE_URL}/articles/${article.slug}`;

  return `
あなたは日本のピックルボール総合メディア「pikura」(@pikura_app) のSNS担当です。
X (Twitter) に投稿するツイート候補を5つ生成してください。

【制約】
- 各ツイートは日本語で140文字以内（ハッシュタグ込み）
- 必ず末尾に #ピックルボール を付ける
- 絵文字は1〜2個まで自然に使う
- 宣伝臭くなく、読みたくなる自然な口調で

【5つのカテゴリと指示】

1. ランキング紹介（選手スポットライト）
   対象選手: ${player.name}（JPA公式ランキング ${player.category} ${player.rank}位、${player.points}pt）
   → 選手の実績を紹介し、ランキングページへの誘導を含めてください。
   URL: ${SITE_URL}/ranking

2. ルール豆知識
   → 「知ってた？」で始まるフック付きのピックルボールルール豆知識。
   例: キッチンルール、サーブルール、スコアリングなど。

3. 記事紹介
   対象記事: 「${article.title}」
   URL: ${articleUrl}
   → 記事の内容を一言で要約し、URLを含めてください。

4. コミュニティ（エンゲージメント）
   → 質問形式や投票を促すツイート。フォロワーが返信したくなる内容。
   例: 「あなたの得意ショットは？」「週何回プレーしてる？」

5. 大会情報
   → ピックルボール大会・イベントへの参加を促す一般的なツイート。
   特定の大会名は出さず、「大会に出てみませんか？」的な内容。
   参考URL: ${SITE_URL}/articles/first-tournament-guide

【出力フォーマット】
各ツイートを以下の形式で出力してください（余計な説明は不要）:

[ランキング紹介] ツイート本文
[ルール豆知識] ツイート本文
[記事紹介] ツイート本文
[コミュニティ] ツイート本文
[大会情報] ツイート本文
`.trim();
}

async function generateTweets(maxRetries = 2) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY が未設定です");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      console.log(`  リトライ中... (${attempt}/${maxRetries})`);
      await new Promise((r) => setTimeout(r, 2000));
    }

    const prompt = buildPrompt();

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: "あなたはピックルボール専門メディアのSNS運用担当です。日本語で、カジュアルだけど信頼感のあるトーンでツイートを作成してください。",
              },
            ],
          },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 1.0, maxOutputTokens: 4096 },
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`  Gemini API エラー (${res.status}): ${errorText.slice(0, 200)}`);
        continue;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.error("  Gemini API からテキストが返されませんでした");
        continue;
      }

      // パースして候補配列にする
      // 2つの形式に対応:
      //   形式1（単一行）: [カテゴリ] ツイート本文
      //   形式2（複数行）: [カテゴリ]\nツイート本文\n...\n\n[次のカテゴリ]
      const tweets = [];
      const blocks = text.trim().split(/\n\s*\n/);

      for (const block of blocks) {
        const lines = block.trim().split("\n").filter((l) => l.trim());
        if (lines.length === 0) continue;

        // 形式1: 単一行
        const singleLineMatch = lines[0].match(/^\[(.+?)\]\s+(.+)$/);
        if (singleLineMatch) {
          tweets.push({ category: singleLineMatch[1], text: singleLineMatch[2].trim() });
          continue;
        }

        // 形式2: 複数行（1行目がカテゴリのみ、2行目以降がツイート本文）
        const categoryMatch = lines[0].match(/^\[(.+?)\]\s*$/);
        if (categoryMatch && lines.length > 1) {
          const tweetText = lines.slice(1).join("").trim();
          if (tweetText) {
            tweets.push({ category: categoryMatch[1], text: tweetText });
          }
        }
      }

      if (tweets.length > 0) return tweets;
      console.error("  ツイートのパースに失敗。生レスポンス:");
      console.error(`  ${text.slice(0, 300)}`);
    } catch (error) {
      console.error(`  リクエストエラー: ${error.message}`);
    }
  }

  return [];
}

// ---------------------------------------------------------------------------
// メイン処理
// ---------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const autoMode = args.includes("--auto");

  console.log("pikura ツイート自動投稿");
  console.log("=".repeat(50));
  console.log("");

  // Step 1: ツイート生成
  console.log("Gemini 2.5 Flash でツイート候補を生成中...");
  console.log("");

  const tweets = await generateTweets();

  if (tweets.length === 0) {
    console.error("ツイート候補の生成に失敗しました。");
    process.exit(1);
  }

  // Step 2: 候補表示
  console.log("-".repeat(50));
  console.log("生成されたツイート候補:");
  console.log("-".repeat(50));
  console.log("");

  for (let i = 0; i < tweets.length; i++) {
    const t = tweets[i];
    console.log(`  ${i + 1}. [${t.category}]`);
    console.log(`     ${t.text}`);
    console.log(`     (${t.text.length}文字)`);
    console.log("");
  }

  if (dryRun) {
    console.log("--- DRY RUN 完了（投稿はスキップ）---");
    return;
  }

  // Step 3: 選択
  let selected;

  if (autoMode) {
    // ランダム選択
    selected = pickRandom(tweets);
    console.log(`自動選択: [${selected.category}]`);
  } else {
    // 対話的選択
    const answer = await askQuestion(`投稿する番号を選んでください (1-${tweets.length}, q=キャンセル): `);

    if (answer.toLowerCase() === "q") {
      console.log("キャンセルしました。");
      return;
    }

    const idx = parseInt(answer, 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= tweets.length) {
      console.error("無効な番号です。");
      process.exit(1);
    }

    selected = tweets[idx];
  }

  // Step 4: 投稿
  console.log("");
  console.log("投稿中...");

  // 環境変数チェック
  const requiredKeys = ["X_CONSUMER_KEY", "X_CONSUMER_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET"];
  const missing = requiredKeys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error("X API の環境変数が未設定です:");
    for (const key of missing) {
      console.error(`  - ${key}`);
    }
    process.exit(1);
  }

  try {
    const result = await postTweet(selected.text);

    // 履歴に記録
    saveHistory({
      date: new Date().toISOString(),
      category: selected.category,
      text: selected.text,
      tweetId: result.id,
      url: result.url,
    });

    console.log("");
    console.log("投稿履歴に記録しました。");
  } catch (error) {
    console.error(`投稿エラー: ${error.message}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`エラー: ${error.message}`);
  process.exit(1);
});
