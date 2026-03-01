/**
 * X (Twitter) ツイート投稿スクリプト
 *
 * 使い方:
 *   node scripts/post-tweet.mjs "ツイート本文"
 *   node scripts/post-tweet.mjs --dry-run "ツイート本文"
 *
 * 環境変数（.env.local に設定）:
 *   X_CONSUMER_KEY, X_CONSUMER_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET
 */

import { TwitterApi } from "twitter-api-v2";

// ---------------------------------------------------------------------------
// 環境変数チェック
// ---------------------------------------------------------------------------
const REQUIRED_KEYS = [
  "X_CONSUMER_KEY",
  "X_CONSUMER_SECRET",
  "X_ACCESS_TOKEN",
  "X_ACCESS_TOKEN_SECRET",
];

function checkEnvVars({ dryRun = false } = {}) {
  // dry-run の場合は認証キー不要
  const keysToCheck = dryRun ? [] : REQUIRED_KEYS;
  const missing = keysToCheck.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error("必要な環境変数が未設定です:");
    for (const key of missing) {
      console.error(`  - ${key}`);
    }
    console.error("");
    console.error("使い方:");
    console.error('  source .env.local && node scripts/post-tweet.mjs "ツイート本文"');
    if (missing.includes("X_ACCESS_TOKEN") || missing.includes("X_ACCESS_TOKEN_SECRET")) {
      console.error("");
      console.error("Access Token / Access Token Secret の取得方法:");
      console.error("  1. https://developer.x.com にアクセス");
      console.error('  2. アプリ「pikura-投稿」→ Keys and Tokens');
      console.error('  3. Access Token and Secret → Generate');
      console.error("  4. .env.local に X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET を追加");
    }
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// ツイート投稿
// ---------------------------------------------------------------------------
export async function postTweet(text, { dryRun = false } = {}) {
  // 文字数チェック（X API は280文字制限）
  if (text.length > 280) {
    throw new Error(`ツイートが280文字を超えています（${text.length}文字）`);
  }

  if (dryRun) {
    console.log("--- DRY RUN（実際には投稿しません）---");
    console.log("");
    console.log(text);
    console.log("");
    console.log(`文字数: ${text.length}/280`);
    return { dryRun: true, text };
  }

  const client = new TwitterApi({
    appKey: process.env.X_CONSUMER_KEY,
    appSecret: process.env.X_CONSUMER_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
  });

  const result = await client.v2.tweet(text);
  const tweetId = result.data.id;
  // ユーザー名が不明なため、ツイートIDのみ表示
  const tweetUrl = `https://x.com/i/web/status/${tweetId}`;

  console.log("投稿成功!");
  console.log(`  ID: ${tweetId}`);
  console.log(`  URL: ${tweetUrl}`);
  console.log(`  本文: ${text}`);

  return { id: tweetId, url: tweetUrl, text };
}

// ---------------------------------------------------------------------------
// メイン処理（直接実行時のみ）
// ---------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  checkEnvVars({ dryRun });
  const textArgs = args.filter((a) => a !== "--dry-run");
  const text = textArgs.join(" ").trim();

  if (!text) {
    console.error("使い方:");
    console.error('  node scripts/post-tweet.mjs "ツイート本文"');
    console.error('  node scripts/post-tweet.mjs --dry-run "ツイート本文"');
    process.exit(1);
  }

  try {
    await postTweet(text, { dryRun });
  } catch (error) {
    console.error(`エラー: ${error.message}`);
    process.exit(1);
  }
}

// ESM の直接実行チェック
const isDirectRun = process.argv[1]?.endsWith("post-tweet.mjs");
if (isDirectRun) {
  main();
}
