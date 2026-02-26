#!/usr/bin/env node

/**
 * アイキャッチ画像生成スクリプト
 *
 * Gemini 2.5 Flash Image モデルを使って、記事のアイキャッチ（サムネイル/ヒーロー）画像を生成する。
 * コスト意識を持ち、1枚ずつ確認しながら生成する。
 *
 * 使い方:
 *   GEMINI_API_KEY=xxx node scripts/generate-eyecatch.mjs paddle-guide
 *   GEMINI_API_KEY=xxx node scripts/generate-eyecatch.mjs --all
 */

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

// --- 定数 ---

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");
const OUTPUT_DIR = join(PROJECT_ROOT, "public", "images", "articles");

const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`;

/** 生成間隔（ミリ秒）— --all 使用時に連続リクエストを避ける */
const DELAY_BETWEEN_GENERATIONS_MS = 3000;

/** プロンプト共通の末尾指示 */
const PROMPT_SUFFIX =
  "No text or watermarks in the image. High quality, professional. 16:9 aspect ratio.";

// --- 記事スラッグ → プロンプトのマッピング ---

const ARTICLE_PROMPTS = {
  "what-is-pickleball":
    "A bright, clean illustration of a pickleball court with players, paddles, and a yellow pickleball. Modern flat design style. Blue sky background. Brand colors: sky blue #0EA5E9, emerald green #10B981, amber #F59E0B.",

  "how-to-start-pickleball":
    "Beginner-friendly illustration showing pickleball equipment (paddle, ball, shoes) neatly arranged. Clean, inviting style. Bright colors.",

  "pickleball-rules":
    "Infographic-style illustration of a pickleball court with rule annotations (kitchen zone highlighted, serve area). Clean diagram style.",

  "paddle-guide":
    "Array of different pickleball paddles displayed in a product showcase style. Clean white background. Modern photography feel.",

  "tokyo-pickleball-courts":
    "Illustration of Tokyo skyline with a pickleball court in foreground. Cherry blossoms. Japanese-style illustration.",

  "doubles-tactics":
    "Top-down view of a pickleball doubles court with player positions and movement arrows. Strategy diagram style.",

  "court-size-setup":
    "Technical illustration showing pickleball court dimensions with measurements. Blueprint/diagram style. Clean lines.",

  "shoes-guide":
    "Collection of athletic shoes arranged in a visually appealing layout. Clean product photography style.",

  "first-tournament-guide":
    "Exciting illustration of a pickleball tournament scene with players, trophy, and crowd. Energetic, colorful.",

  "jpa-ranking-explained":
    "Modern data visualization illustration showing ranking leaderboard. Numbers, charts, podium. Clean digital style.",
};

/** 全記事スラッグ一覧 */
const ALL_SLUGS = Object.keys(ARTICLE_PROMPTS);

// --- ユーティリティ関数 ---

/**
 * ユーザーに確認を求める（y/N）
 * @param {string} message - 表示するメッセージ
 * @returns {Promise<boolean>} ユーザーが y を入力した場合 true
 */
function confirm(message) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

/**
 * 指定ミリ秒待機する
 * @param {number} ms - 待機時間（ミリ秒）
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Gemini API を呼び出してアイキャッチ画像を生成する
 * @param {string} slug - 記事スラッグ
 * @returns {Promise<{imageData: string, mimeType: string, textResponse: string | null}>}
 */
async function generateImage(slug) {
  const basePrompt = ARTICLE_PROMPTS[slug];
  if (!basePrompt) {
    throw new Error(
      `未知の記事スラッグ: "${slug}"\n有効なスラッグ: ${ALL_SLUGS.join(", ")}`
    );
  }

  const fullPrompt = `${basePrompt} ${PROMPT_SUFFIX}`;

  console.log(`\n🎨 プロンプト: ${fullPrompt}`);
  console.log(`⏳ Gemini API に画像生成をリクエスト中...`);

  // Gemini API リクエスト
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K",
        },
      },
    }),
  });

  // レスポンスのパース
  const data = await response.json();

  // エラーハンドリング
  if (!response.ok || data.error) {
    const errorMessage = data.error?.message || JSON.stringify(data);
    const errorCode = data.error?.code || response.status;

    // 課金関連のエラーの場合、分かりやすいメッセージを表示
    if (
      errorMessage.includes("billing") ||
      errorMessage.includes("quota") ||
      errorCode === 403 ||
      errorCode === 429
    ) {
      console.error(`\n❌ API エラー (${errorCode}): ${errorMessage}`);
      console.error(`\n💡 解決方法:`);
      console.error(
        `   1. Google AI Studio (https://aistudio.google.com/) にアクセス`
      );
      console.error(`   2. 左メニューの「Settings」→「Billing」を開く`);
      console.error(
        `   3. 課金を有効化し、支払い方法を設定する`
      );
      console.error(
        `   4. API キーが有効であることを確認する`
      );
      console.error(
        `\n   ※ Gemini 2.5 Flash の画像生成は有料機能です（無料枠では利用できない場合があります）`
      );
    } else {
      console.error(`\n❌ API エラー (${errorCode}): ${errorMessage}`);
    }

    throw new Error(`API リクエスト失敗: ${errorMessage}`);
  }

  // レスポンスから画像データとテキストを抽出
  const parts = data.candidates?.[0]?.content?.parts;
  if (!parts || parts.length === 0) {
    throw new Error(
      "APIレスポンスにパーツが含まれていません。レスポンス: " +
        JSON.stringify(data, null, 2)
    );
  }

  let imageData = null;
  let mimeType = null;
  let textResponse = null;

  for (const part of parts) {
    if (part.inlineData?.data) {
      // 画像データ（base64）
      imageData = part.inlineData.data;
      mimeType = part.inlineData.mimeType;
    } else if (part.text) {
      // テキストレスポンス（モデルからのコメントなど）
      textResponse = part.text;
    }
  }

  if (!imageData) {
    throw new Error(
      "APIレスポンスに画像データが含まれていません。レスポンス: " +
        JSON.stringify(data, null, 2)
    );
  }

  return { imageData, mimeType, textResponse };
}

/**
 * 画像をファイルに保存する
 * @param {string} slug - 記事スラッグ
 * @param {string} imageData - base64エンコードされた画像データ
 */
async function saveImage(slug, imageData) {
  // 出力ディレクトリが存在しない場合は作成
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`📁 ディレクトリ作成: ${OUTPUT_DIR}`);
  }

  const outputPath = join(OUTPUT_DIR, `${slug}.png`);
  const buffer = Buffer.from(imageData, "base64");
  await writeFile(outputPath, buffer);

  // ファイルサイズを表示
  const fileSizeKB = (buffer.length / 1024).toFixed(1);
  console.log(`✅ 保存完了: ${outputPath} (${fileSizeKB} KB)`);

  return outputPath;
}

/**
 * 1つの記事のアイキャッチ画像を生成する
 * @param {string} slug - 記事スラッグ
 * @returns {Promise<boolean>} 成功した場合 true
 */
async function generateForSlug(slug) {
  try {
    const { imageData, mimeType, textResponse } = await generateImage(slug);

    if (textResponse) {
      console.log(`💬 モデルからのコメント: ${textResponse}`);
    }
    console.log(`🖼️  MIME タイプ: ${mimeType}`);

    await saveImage(slug, imageData);
    return true;
  } catch (error) {
    console.error(`\n❌ "${slug}" の画像生成に失敗: ${error.message}`);
    return false;
  }
}

// --- メイン処理 ---

async function main() {
  // API キーの確認
  if (!API_KEY) {
    console.error("❌ 環境変数 GEMINI_API_KEY が設定されていません。");
    console.error(
      "   使い方: GEMINI_API_KEY=xxx node scripts/generate-eyecatch.mjs <slug>"
    );
    process.exit(1);
  }

  // CLI 引数の取得
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("❌ 記事スラッグまたは --all を指定してください。");
    console.error("");
    console.error("使い方:");
    console.error(
      "  GEMINI_API_KEY=xxx node scripts/generate-eyecatch.mjs <slug>"
    );
    console.error(
      "  GEMINI_API_KEY=xxx node scripts/generate-eyecatch.mjs --all"
    );
    console.error("");
    console.error("有効なスラッグ:");
    for (const slug of ALL_SLUGS) {
      console.error(`  - ${slug}`);
    }
    process.exit(1);
  }

  const isAll = args.includes("--all");
  const slugs = isAll ? ALL_SLUGS : [args[0]];

  // スラッグの妥当性チェック（単一指定の場合）
  if (!isAll && !ARTICLE_PROMPTS[slugs[0]]) {
    console.error(`❌ 未知の記事スラッグ: "${slugs[0]}"`);
    console.error("");
    console.error("有効なスラッグ:");
    for (const slug of ALL_SLUGS) {
      console.error(`  - ${slug}`);
    }
    process.exit(1);
  }

  // コスト見積もりの表示
  console.log("=".repeat(60));
  console.log("📸 pikura.app アイキャッチ画像生成");
  console.log("=".repeat(60));
  console.log(`\n💰 推定コスト: ¥3-6（$0.02-0.04）/ 1画像`);
  console.log(`📊 生成予定: ${slugs.length} 枚`);

  if (slugs.length > 1) {
    const minCost = slugs.length * 3;
    const maxCost = slugs.length * 6;
    console.log(`💰 合計推定コスト: ¥${minCost}-${maxCost}`);
  }

  console.log(`\n生成対象:`);
  for (const slug of slugs) {
    console.log(`  - ${slug}`);
  }
  console.log(`\n出力先: ${OUTPUT_DIR}/`);

  // ユーザー確認
  const ok = await confirm("\n以下の画像を生成します。よろしいですか？");
  if (!ok) {
    console.log("キャンセルしました。");
    process.exit(0);
  }

  // 画像生成の実行
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];

    console.log(`\n${"─".repeat(50)}`);
    console.log(
      `📸 [${i + 1}/${slugs.length}] ${slug} を生成中...`
    );

    const success = await generateForSlug(slug);

    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // --all モードの場合、コスト集計を表示
    if (isAll) {
      const minRunningCost = successCount * 3;
      const maxRunningCost = successCount * 6;
      console.log(
        `💰 累計コスト（推定）: ¥${minRunningCost}-${maxRunningCost}（${successCount} 枚成功 / ${failCount} 枚失敗）`
      );

      // 次の生成がある場合は待機（API レートリミット対策）
      if (i < slugs.length - 1) {
        console.log(
          `⏳ ${DELAY_BETWEEN_GENERATIONS_MS / 1000} 秒待機中...`
        );
        await sleep(DELAY_BETWEEN_GENERATIONS_MS);
      }
    }
  }

  // 結果サマリー
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📊 生成結果サマリー`);
  console.log(`   成功: ${successCount} 枚`);
  console.log(`   失敗: ${failCount} 枚`);
  if (successCount > 0) {
    const minTotal = successCount * 3;
    const maxTotal = successCount * 6;
    console.log(`   💰 推定合計コスト: ¥${minTotal}-${maxTotal}`);
  }
  console.log("=".repeat(60));

  // 失敗があった場合は終了コード 1
  if (failCount > 0) {
    process.exit(1);
  }
}

// スクリプト実行
main().catch((error) => {
  console.error("予期しないエラー:", error);
  process.exit(1);
});
