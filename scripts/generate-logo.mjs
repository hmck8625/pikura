#!/usr/bin/env node

/**
 * ブランドアセット生成スクリプト
 *
 * Gemini 2.5 Flash Image モデルを使って、pikura.app のブランドアセット
 * （ロゴ、ヒーロー画像、デフォルトアバター）を生成する。
 * コスト意識を持ち、1枚ずつ確認しながら生成する。
 *
 * 使い方:
 *   GEMINI_API_KEY=xxx node scripts/generate-logo.mjs logo-icon
 *   GEMINI_API_KEY=xxx node scripts/generate-logo.mjs --all
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

const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`;

/** 生成間隔（ミリ秒）— --all 使用時に連続リクエストを避ける */
const DELAY_BETWEEN_GENERATIONS_MS = 3000;

// --- アセット定義 ---

const ASSETS = {
  "logo-icon": {
    prompt:
      "Design a modern app icon for 'pikura', a Japanese pickleball media platform. The icon features a stylized pickleball (yellow/amber ball with characteristic holes) integrated with a subtle 'P' shape. Brand colors: Sky Blue #0EA5E9, Emerald Green #10B981, Amber #F59E0B. Clean, minimal, modern design suitable as social media profile icon. White background. Square format. No text. Professional sports brand feel. High quality.",
    aspectRatio: "1:1",
    outputDir: "public/images/brand",
  },
  "logo-full": {
    prompt:
      "Design a horizontal logo for 'pikura', a Japanese pickleball media platform. Left side: a stylized pickleball icon (yellow/amber ball with characteristic holes). Right side: the word 'pikura' in a clean, bold, modern sans-serif font in dark navy color. Brand colors for icon: Sky Blue #0EA5E9, Emerald Green #10B981, Amber #F59E0B. White background. Clean, professional, sporty feel. Suitable for website header. No other text or tagline. High quality.",
    aspectRatio: "16:9",
    outputDir: "public/images/brand",
  },
  "logo-full-dark": {
    prompt:
      "Design a horizontal logo for 'pikura', a Japanese pickleball media platform. Left side: a stylized pickleball icon (yellow/amber ball with characteristic holes). Right side: the word 'pikura' in a clean, bold, modern sans-serif font in WHITE color. Brand colors for icon: Sky Blue #0EA5E9, Emerald Green #10B981, Amber #F59E0B. Dark navy background #0f172a. Clean, professional, sporty feel. Suitable for dark backgrounds. No other text or tagline. High quality.",
    aspectRatio: "16:9",
    outputDir: "public/images/brand",
  },
  "hero-pickleball": {
    prompt:
      "A wide panoramic illustration of people playing pickleball on a bright outdoor court. Modern flat illustration style. Four diverse players in action, joyful and energetic. Sky blue sky, green court, yellow pickleball in motion. Clean, professional, Japanese-inspired minimal aesthetic. Brand colors: Sky Blue #0EA5E9, Emerald Green #10B981, Amber #F59E0B. No text or watermarks. Suitable as a website hero banner background. High quality.",
    aspectRatio: "16:9",
    outputDir: "public/images/hero",
  },
  "default-avatar": {
    prompt:
      "A minimal, clean icon of a pickleball player silhouette holding a paddle in ready position. Flat design, single color sky blue #0EA5E9 on white background. Suitable as a default profile avatar placeholder. Square format. No text. Simple, recognizable sports silhouette. Modern, clean design. High quality.",
    aspectRatio: "1:1",
    outputDir: "public/images/brand",
  },
};

/** 全アセット名一覧 */
const ALL_ASSET_NAMES = Object.keys(ASSETS);

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
 * Gemini API を呼び出してブランドアセット画像を生成する
 * @param {string} assetName - アセット名
 * @returns {Promise<{imageData: string, mimeType: string, textResponse: string | null}>}
 */
async function generateImage(assetName) {
  const asset = ASSETS[assetName];
  if (!asset) {
    throw new Error(
      `未知のアセット名: "${assetName}"\n有効なアセット名: ${ALL_ASSET_NAMES.join(", ")}`
    );
  }

  console.log(`\n🎨 プロンプト: ${asset.prompt}`);
  console.log(`📐 アスペクト比: ${asset.aspectRatio}`);
  console.log(`⏳ Gemini API に画像生成をリクエスト中...`);

  // Gemini API リクエスト
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: asset.prompt }] }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: asset.aspectRatio,
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
 * @param {string} assetName - アセット名
 * @param {string} imageData - base64エンコードされた画像データ
 * @returns {Promise<string>} 保存先のパス
 */
async function saveImage(assetName, imageData) {
  const asset = ASSETS[assetName];
  const outputDir = join(PROJECT_ROOT, asset.outputDir);

  // 出力ディレクトリが存在しない場合は作成
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
    console.log(`📁 ディレクトリ作成: ${outputDir}`);
  }

  const outputPath = join(outputDir, `${assetName}.png`);
  const buffer = Buffer.from(imageData, "base64");
  await writeFile(outputPath, buffer);

  // ファイルサイズを表示
  const fileSizeKB = (buffer.length / 1024).toFixed(1);
  console.log(`✅ 保存完了: ${outputPath} (${fileSizeKB} KB)`);

  return outputPath;
}

/**
 * 1つのブランドアセット画像を生成する
 * @param {string} assetName - アセット名
 * @returns {Promise<boolean>} 成功した場合 true
 */
async function generateForAsset(assetName) {
  try {
    const { imageData, mimeType, textResponse } =
      await generateImage(assetName);

    if (textResponse) {
      console.log(`💬 モデルからのコメント: ${textResponse}`);
    }
    console.log(`🖼️  MIME タイプ: ${mimeType}`);

    await saveImage(assetName, imageData);
    return true;
  } catch (error) {
    console.error(
      `\n❌ "${assetName}" の画像生成に失敗: ${error.message}`
    );
    return false;
  }
}

// --- メイン処理 ---

async function main() {
  // API キーの確認
  if (!API_KEY) {
    console.error("❌ 環境変数 GEMINI_API_KEY が設定されていません。");
    console.error(
      "   使い方: GEMINI_API_KEY=xxx node scripts/generate-logo.mjs <asset-name>"
    );
    process.exit(1);
  }

  // CLI 引数の取得
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("❌ アセット名または --all を指定してください。");
    console.error("");
    console.error("使い方:");
    console.error(
      "  GEMINI_API_KEY=xxx node scripts/generate-logo.mjs <asset-name>"
    );
    console.error(
      "  GEMINI_API_KEY=xxx node scripts/generate-logo.mjs --all"
    );
    console.error("");
    console.error("有効なアセット名:");
    for (const name of ALL_ASSET_NAMES) {
      const asset = ASSETS[name];
      console.error(
        `  - ${name}  (${asset.aspectRatio}, → ${asset.outputDir}/)`
      );
    }
    process.exit(1);
  }

  const isAll = args.includes("--all");
  const assetNames = isAll ? ALL_ASSET_NAMES : [args[0]];

  // アセット名の妥当性チェック（単一指定の場合）
  if (!isAll && !ASSETS[assetNames[0]]) {
    console.error(`❌ 未知のアセット名: "${assetNames[0]}"`);
    console.error("");
    console.error("有効なアセット名:");
    for (const name of ALL_ASSET_NAMES) {
      const asset = ASSETS[name];
      console.error(
        `  - ${name}  (${asset.aspectRatio}, → ${asset.outputDir}/)`
      );
    }
    process.exit(1);
  }

  // コスト見積もりの表示
  console.log("=".repeat(60));
  console.log("🎨 pikura.app ブランドアセット生成");
  console.log("=".repeat(60));
  console.log(`\n💰 推定コスト: ¥3-6（$0.02-0.04）/ 1画像`);
  console.log(`📊 生成予定: ${assetNames.length} 枚`);

  if (assetNames.length > 1) {
    const minCost = assetNames.length * 3;
    const maxCost = assetNames.length * 6;
    console.log(`💰 合計推定コスト: ¥${minCost}-${maxCost}`);
  }

  console.log(`\n生成対象:`);
  for (const name of assetNames) {
    const asset = ASSETS[name];
    console.log(
      `  - ${name}  (${asset.aspectRatio}, → ${asset.outputDir}/${name}.png)`
    );
  }

  // ユーザー確認
  const ok = await confirm("\n以下の画像を生成します。よろしいですか？");
  if (!ok) {
    console.log("キャンセルしました。");
    process.exit(0);
  }

  // 画像生成の実行
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < assetNames.length; i++) {
    const assetName = assetNames[i];

    console.log(`\n${"─".repeat(50)}`);
    console.log(
      `🎨 [${i + 1}/${assetNames.length}] ${assetName} を生成中...`
    );

    const success = await generateForAsset(assetName);

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
      if (i < assetNames.length - 1) {
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
