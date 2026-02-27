#!/usr/bin/env node

/**
 * Tシャツデザイン & モックアップ画像生成スクリプト
 *
 * Gemini API (Nano Banana) を使って、ピックルボールTシャツのモックアップ画像を生成する。
 *
 * 使い方:
 *   GEMINI_API_KEY=xxx node scripts/generate-tshirt-designs.mjs                    # 全デザイン生成
 *   GEMINI_API_KEY=xxx node scripts/generate-tshirt-designs.mjs stay-out-of-the-kitchen  # 特定デザインのみ
 *   GEMINI_API_KEY=xxx node scripts/generate-tshirt-designs.mjs --list             # デザイン一覧表示
 */

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");
const OUTPUT_DIR = join(PROJECT_ROOT, "public", "images", "shop");

const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`;

const DELAY_MS = 3000;

// --- デザイン定義 ---

const DESIGNS = {
  "stay-out-of-the-kitchen": {
    text: "STAY OUT OF THE KITCHEN!",
    style:
      "Warning sign style sport logo. Bold red and white colors. Caution/danger sign aesthetic with a pickleball court kitchen zone icon.",
  },
  "my-partners-fault": {
    text: "IT'S MY PARTNER'S FAULT.",
    style:
      "Minimalist modern typography with a sideways arrow pointing to the right. Clean sans-serif font. Black text on white shirt.",
  },
  "ball-on": {
    text: "LET! BALL ON!",
    style:
      "Emergency alert style with bold uppercase letters. Red alert/siren aesthetic. Dynamic typography with motion lines.",
  },
  "dont-interrupt-my-dink": {
    text: "Don't interrupt my dink.",
    style:
      "Two paddles and two balls colliding mid-air with sparks. Dynamic illustration with elegant script font below.",
  },
  "zero-zero-start": {
    text: "0-0-START",
    style:
      "Scoreboard style with large athletic numbers. LED display or stadium scoreboard aesthetic. Bold sport font.",
  },
  "third-shot-drop-expert": {
    text: "Third Shot Drop Expert* (*self-proclaimed)",
    style:
      "Confident bold title with tiny asterisk footnote. Certificate/diploma style border. Humorous contrast between big and small text.",
  },
  "kitchen-police": {
    text: "KITCHEN POLICE",
    style:
      "Police badge emblem design. Shield shape with crossed paddles. Official law enforcement aesthetic with pickleball twist.",
  },
  "dink-responsibly": {
    text: "DINK RESPONSIBLY",
    style:
      "Vintage alcohol warning label style. Retro beer/whiskey label aesthetic. Ornate border with old-fashioned serif fonts.",
  },
  "came-for-exercise": {
    text: "I came for the exercise, stayed for the drama.",
    style:
      "Elegant mix of script and sans-serif fonts. Lifestyle/wellness aesthetic. Subtle pickleball icon accent.",
  },
  "dupr-doesnt-define-me": {
    text: "My DUPR doesn't define me. (...but what is it though?)",
    style:
      "Bold statement top line, small italic parenthetical below. Self-deprecating humor. Modern minimalist layout.",
  },
  "dink-or-die": {
    text: "DINK OR DIE",
    style:
      "Bold, aggressive street style. Large block letters. Skateboard/streetwear aesthetic. High contrast black and white.",
  },
  "kitchen-certified": {
    text: "KITCHEN CERTIFIED",
    style:
      "Circular stamp/seal design. EST. 2026 at bottom. Certification badge aesthetic. Green and gold colors.",
  },
  "net-game-no-mercy": {
    text: "NET GAME. NO MERCY.",
    style:
      "Military stencil font. Army/tactical aesthetic. Distressed texture. Khaki and olive color scheme.",
  },
  "eat-sleep-dink-repeat": {
    text: "EAT. SLEEP. DINK. REPEAT.",
    style:
      "Monospace font stacked vertically. Clean grid layout. Icons next to each word (fork, moon, paddle, arrows). Modern infographic style.",
  },
  "drop-it-like-its-hot": {
    text: "DROP IT LIKE IT'S HOT",
    style:
      "Retro hip-hop graffiti font. 90s throwback style. Flames and dripping paint effects. Colorful and bold.",
  },
  "kitchen-haittemasen": {
    text: "キッチン入ってないです",
    style:
      "Handwritten Japanese font with sweat drop emoji effect. Casual denial expression. Kitchen line illustration in background.",
  },
  "dink-shugyochu": {
    text: "ディンク修行中",
    style:
      "Japanese calligraphy brush stroke style (書道). Powerful ink brush aesthetic. Zen/martial arts training atmosphere.",
  },
  "partner-boshuchu": {
    text: "パートナー募集中",
    style:
      "Retro Japanese recruitment poster style. Bold text in frame. Help wanted ad aesthetic.",
  },
  "pickler-desu": {
    text: "ピクラーです。",
    style:
      "Simple modern Gothic Japanese font. Statement tee. Clean, centered. Small pickleball icon below text.",
  },
  "kyo-mo-pickle": {
    text: "今日もピクる。",
    style:
      "Casual round Gothic Japanese font. Friendly, everyday feeling. Pastel accent color. Cute but not childish.",
  },
  "minimal-paddle": {
    text: "",
    style:
      "Geometric minimalist paddle and ball silhouette. Single color (sky blue). Abstract, modern art poster style. No text.",
  },
  "court-blueprint": {
    text: "",
    style:
      "Blueprint/architectural drawing of a pickleball court from above. White lines on navy blue. Dimension annotations. Engineering diagram style.",
  },
  "japanese-wave-pickle": {
    text: "",
    style:
      "Hokusai Great Wave style with a pickleball riding the wave instead of boats. Japanese woodblock print aesthetic. Traditional blue and white.",
  },
  "neon-pickle": {
    text: "PICKLE",
    style:
      "Neon sign style glowing text and paddle icon. Bar sign aesthetic on dark background. Pink and cyan glow effects.",
  },
  "pikura-original": {
    text: "PIKURA",
    style:
      "Clean brand logo. Sky blue (#0EA5E9) primary color. Modern sans-serif. Small tagline: Japan's Pickleball Platform. Professional sportswear brand aesthetic.",
  },
};

const ALL_SLUGS = Object.keys(DESIGNS);

// --- ユーティリティ ---

function confirm(message) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Gemini API でTシャツモックアップ画像を生成
 */
async function generateMockup(slug) {
  const design = DESIGNS[slug];
  if (!design) throw new Error(`Unknown slug: ${slug}`);

  const textPart = design.text
    ? `The design text on the shirt reads: "${design.text}".`
    : "This is a graphic-only design with no text.";

  const prompt = `Generate a realistic e-commerce product photo of a sporty dry-fit T-shirt with a design printed on the chest area. Show the actual T-shirt as a real product — either neatly folded, laid flat, or displayed on an invisible mannequin — so the customer can clearly see what the shirt looks like as a real product they would buy.

${textPart}

Design style: ${design.style}

Requirements:
- Show a REAL T-shirt product photo, not just artwork. The shirt fabric, seams, collar, and sleeves should be visible
- The printed design should be clearly visible on the chest area of the shirt
- Professional e-commerce product photography (like Uniqlo, Nike, or Amazon product listing)
- White or light-colored athletic dry-fit T-shirt material with slight fabric texture
- Clean white or very light gray background
- Soft studio lighting, minimal shadows
- 1:1 square aspect ratio
- High resolution, sharp focus on the shirt and design
- No human model, no watermarks, no extra text outside the shirt`;

  console.log(`  Requesting Gemini API...`);

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    }),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    const msg = data.error?.message || JSON.stringify(data);
    throw new Error(`API error: ${msg}`);
  }

  const parts = data.candidates?.[0]?.content?.parts;
  if (!parts) throw new Error("No parts in response");

  let imageData = null;
  for (const part of parts) {
    if (part.inlineData?.data) {
      imageData = part.inlineData.data;
    }
  }

  if (!imageData) throw new Error("No image data in response");
  return imageData;
}

async function saveImage(slug, imageData) {
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }

  const outputPath = join(OUTPUT_DIR, `${slug}.png`);
  const buffer = Buffer.from(imageData, "base64");
  await writeFile(outputPath, buffer);

  const sizeKB = (buffer.length / 1024).toFixed(1);
  console.log(`  Saved: ${outputPath} (${sizeKB} KB)`);
  return outputPath;
}

// --- メイン ---

async function main() {
  if (!API_KEY) {
    console.error("GEMINI_API_KEY is not set.");
    console.error(
      "Usage: GEMINI_API_KEY=xxx node scripts/generate-tshirt-designs.mjs",
    );
    process.exit(1);
  }

  const args = process.argv.slice(2);

  if (args.includes("--list")) {
    console.log(`\nAvailable designs (${ALL_SLUGS.length}):\n`);
    for (const slug of ALL_SLUGS) {
      const d = DESIGNS[slug];
      console.log(`  ${slug}`);
      console.log(`    Text: ${d.text || "(graphic only)"}`);
      console.log(`    Style: ${d.style.substring(0, 60)}...`);
      console.log();
    }
    process.exit(0);
  }

  const slugs = args.length > 0 && !args[0].startsWith("--") ? [args[0]] : ALL_SLUGS;

  if (slugs.length === 1 && !DESIGNS[slugs[0]]) {
    console.error(`Unknown design: "${slugs[0]}"`);
    console.error(`Run with --list to see available designs.`);
    process.exit(1);
  }

  console.log("=".repeat(60));
  console.log("Pikura T-shirt Mockup Generator");
  console.log("=".repeat(60));
  console.log(`  Designs: ${slugs.length}`);
  console.log(`  Est. cost: ¥${slugs.length * 3}-${slugs.length * 6}`);
  console.log(`  Output: ${OUTPUT_DIR}/`);
  console.log();

  const ok = await confirm("Generate mockup images?");
  if (!ok) {
    console.log("Cancelled.");
    process.exit(0);
  }

  let success = 0;
  let fail = 0;

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    console.log(`\n[${i + 1}/${slugs.length}] ${slug}`);

    try {
      const imageData = await generateMockup(slug);
      await saveImage(slug, imageData);
      success++;
    } catch (error) {
      console.error(`  FAILED: ${error.message}`);
      fail++;
    }

    if (i < slugs.length - 1) {
      console.log(`  Waiting ${DELAY_MS / 1000}s...`);
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Done: ${success} generated, ${fail} failed`);
  console.log(`Est. cost: ¥${success * 3}-${success * 6}`);
  console.log("=".repeat(60));

  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error("Unexpected error:", e);
  process.exit(1);
});
