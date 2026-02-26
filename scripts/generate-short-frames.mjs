/**
 * ショート動画フレーム画像生成スクリプト
 *
 * 指定テーマのショート動画用フレーム画像を Gemini API で一括生成（9:16縦型）。
 * テキストは一切含めず、テロップは FFmpeg で後から焼き込む設計。
 *
 * 使い方:
 *   GEMINI_API_KEY=xxx node scripts/generate-short-frames.mjs [テーマ名]
 *   GEMINI_API_KEY=xxx node scripts/generate-short-frames.mjs kitchen-rules
 */

import { writeFileSync, mkdirSync } from "fs";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("GEMINI_API_KEY が未設定です");
  process.exit(1);
}

// ========================================
// 共通スタイルディレクティブ
// ========================================

const STYLE = [
  "Modern flat vector illustration style.",
  "Clean geometric shapes, bold outlines, bright vibrant colors.",
  "Consistent color palette: Sky Blue #0EA5E9, Emerald Green #10B981, Amber #F59E0B, Dark Navy #0f172a.",
  "Vertical 9:16 format for mobile video.",
  "IMPORTANT: Absolutely no text, no letters, no words, no numbers, no writing, no characters of any language in the image. Pure illustration only.",
].join(" ");

// ========================================
// テーマ別フレーム定義
// ========================================

const THEMES = {
  "kitchen-rules": {
    outputDir: "public/images/shorts/kitchen-rules",
    frames: [
      {
        name: "00_logo",
        prompt: `A stylized pickleball with characteristic holes, colored in amber and yellow tones, centered on a dark navy #0f172a background. Around the ball, subtle geometric accent shapes in sky blue #0EA5E9 and emerald green #10B981. Clean, minimal, professional brand feel. ${STYLE}`,
      },
      {
        name: "01_hook_kitchen",
        prompt: `A pickleball court viewed from above with the kitchen zone (area near the net on both sides) glowing in bright orange-red color, contrasting with the green court. A large stylized question mark icon floats above the highlighted zone. Eye-catching composition. ${STYLE}`,
      },
      {
        name: "02_court_nvz",
        prompt: `A pickleball court diagram viewed from a slight angle above. The Non-Volley Zone (kitchen) highlighted in bright emerald green #10B981 on both sides of the net. The net is clearly visible. Measurement arrows showing the 7-foot zone. Technical diagram feel but in flat illustration style. ${STYLE}`,
      },
      {
        name: "03_volley_ng",
        prompt: `A pickleball player standing inside the kitchen zone hitting a ball in the air (volley). A big bold red X mark overlay indicating this action is forbidden. The player's feet are clearly inside the zone line. Dynamic pose, clear visual communication of a rule violation. ${STYLE}`,
      },
      {
        name: "04_foot_fault",
        prompt: `Close-up illustration focusing on a pickleball player's shoes and feet near a court line. One foot's toe is touching the kitchen line. A red glowing circle highlights the foot fault. The kitchen zone is colored differently from the main court. Clear focus on the rule violation detail. ${STYLE}`,
      },
      {
        name: "05_bounce_ok",
        prompt: `A pickleball bouncing once on the court inside the kitchen zone with a dotted arc showing the bounce trajectory, then a player stepping in to hit it. A big bold green checkmark overlay indicating this is allowed. Positive, encouraging composition. ${STYLE}`,
      },
      {
        name: "06_strategy_dink",
        prompt: `Two pickleball players at the kitchen line engaged in a dink rally, softly hitting the ball just over the net with low arcs. Both players in focused strategic positions. The ball trajectory shows controlled low arcs. Energetic but tactical scene. ${STYLE}`,
      },
      {
        name: "07_fun_players",
        prompt: `Four diverse happy pickleball players on a bright outdoor court, giving high-fives and celebrating. Paddles in hand, big smiles. Bright sunshine, colorful court. Welcoming, joyful atmosphere that makes beginners want to try the sport. ${STYLE}`,
      },
      {
        name: "08_cta_pikura",
        prompt: `A stylized pickleball in amber/yellow centered on dark navy #0f172a background. Decorative geometric shapes and lines in sky blue #0EA5E9 and emerald green #10B981 form an elegant frame around the ball. Clean, modern, minimal end-screen design. No icons, no buttons, no call-to-action elements. ${STYLE}`,
      },
    ],
  },
};

// ========================================
// メイン処理
// ========================================

const themeName = process.argv[2] || "kitchen-rules";
const theme = THEMES[themeName];

if (!theme) {
  console.error(`未知のテーマ: "${themeName}"`);
  console.error(`有効なテーマ: ${Object.keys(THEMES).join(", ")}`);
  process.exit(1);
}

const { outputDir, frames } = theme;

async function generateFrame(frame, index) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`;

  console.log(`\n[${index + 1}/${frames.length}] ${frame.name} を生成中...`);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: frame.prompt }] }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: { aspectRatio: "9:16", imageSize: "1K" },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`   エラー (${res.status}): ${err.slice(0, 200)}`);
    return false;
  }

  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts || [];

  for (const part of parts) {
    if (part.inlineData) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      const path = `${outputDir}/${frame.name}.png`;
      writeFileSync(path, buffer);
      console.log(`   保存: ${path} (${(buffer.length / 1024).toFixed(1)} KB)`);
      return true;
    }
  }

  console.error(`   画像データが返されませんでした`);
  return false;
}

console.log(`ショート動画フレーム画像生成`);
console.log(`   テーマ: ${themeName}`);
console.log(`   フレーム数: ${frames.length}枚`);
console.log(`   推定コスト: ¥${frames.length * 3}-${frames.length * 6}`);
console.log(`   出力先: ${outputDir}/`);

mkdirSync(outputDir, { recursive: true });

let success = 0;
let fail = 0;

for (let i = 0; i < frames.length; i++) {
  const ok = await generateFrame(frames[i], i);
  if (ok) success++;
  else fail++;

  if (i < frames.length - 1) {
    await new Promise((r) => setTimeout(r, 3000));
  }
}

console.log(`\n============================`);
console.log(`生成結果: 成功 ${success}枚 / 失敗 ${fail}枚`);
console.log(`推定コスト: ¥${success * 3}-${success * 6}`);
console.log(`============================`);
