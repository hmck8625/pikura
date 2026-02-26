/**
 * ショート動画フレーム画像生成スクリプト
 *
 * 「キッチンルール解説」ショート動画用の全フレーム画像を
 * Gemini APIで一括生成します（9:16縦型）。
 *
 * 使い方:
 *   GEMINI_API_KEY=xxx node scripts/generate-short-frames.mjs
 */

import { writeFileSync, mkdirSync } from "fs";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("GEMINI_API_KEY が未設定です");
  process.exit(1);
}

const OUTPUT_DIR = "public/images/shorts/kitchen-rules";

// フレーム定義（各シーンの画像）
const FRAMES = [
  {
    name: "00_logo",
    prompt:
      "A clean, modern logo screen for 'pikura' - a Japanese pickleball media platform. Dark navy blue background. The word 'pikura' in bold white modern font centered. A small pickleball icon (yellow ball with holes) next to the text. Minimal, professional. Brand colors: sky blue #0EA5E9 accent. Vertical 9:16 format for mobile video.",
  },
  {
    name: "01_hook_kitchen",
    prompt:
      "A pickleball court viewed from above with the Kitchen/Non-Volley Zone highlighted in bright red/orange color. The rest of the court is green. A large question mark icon floating above the kitchen zone. Clean flat illustration style. Vertical 9:16 format for mobile video. No text. Bright, eye-catching colors.",
  },
  {
    name: "02_court_nvz",
    prompt:
      "A pickleball court diagram viewed from above. The Non-Volley Zone (kitchen) area on both sides of the net is highlighted in bright emerald green #10B981. The net is clearly visible in the center. Clean technical diagram style with measurements showing 7 feet for the kitchen zone. Vertical 9:16 format. No text labels, just the visual diagram.",
  },
  {
    name: "03_volley_ng",
    prompt:
      "Illustration of a pickleball player standing inside the kitchen zone (Non-Volley Zone) hitting a ball in the air (volley). A big red X mark overlay indicating this is NOT allowed. The player's foot is on or past the kitchen line. Clean cartoon/illustration style. Vertical 9:16 format. Bright colors, clear visual communication.",
  },
  {
    name: "04_foot_fault",
    prompt:
      "Close-up illustration of a pickleball player's feet near the kitchen line. One foot's toe is touching/crossing the kitchen line. A red circle highlights the foot fault. The kitchen zone is colored differently from the rest of the court. Clean illustration style. Vertical 9:16 format. Clear visual of the rule violation.",
  },
  {
    name: "05_bounce_ok",
    prompt:
      "Illustration of a pickleball bouncing once inside the kitchen zone (Non-Volley Zone), then a player stepping in to hit it after the bounce. A big green checkmark/OK symbol overlay. The bounce trajectory is shown with a dotted arc line. Clean cartoon/illustration style. Vertical 9:16 format. Positive, bright colors.",
  },
  {
    name: "06_strategy_dink",
    prompt:
      "Dynamic illustration of two pickleball players at the kitchen line engaged in a dink rally (soft shots just over the net). Both players are focused and positioned strategically. The ball trajectory shows a low arc over the net. Energetic but controlled scene. Clean illustration style. Vertical 9:16 format. Vibrant colors.",
  },
  {
    name: "07_fun_players",
    prompt:
      "Cheerful illustration of four diverse pickleball players on a court, smiling and having fun. They are holding paddles and giving high-fives or thumbs up. Bright sunshine, colorful court. Happy, welcoming atmosphere that makes beginners want to try the sport. Clean illustration style. Vertical 9:16 format.",
  },
  {
    name: "08_cta_pikura",
    prompt:
      "End screen for a vertical video. Dark navy blue background. 'pikura.app' in large bold white text centered. Below it, a tagline in Japanese style. A pickleball icon (yellow) above the text. Clean, modern, minimal design. Call-to-action feeling. Brand colors: sky blue #0EA5E9, amber #F59E0B accent. Vertical 9:16 format.",
  },
];

async function generateFrame(frame, index) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`;

  console.log(`\n📸 [${index + 1}/${FRAMES.length}] ${frame.name} を生成中...`);

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
    console.error(`   ❌ エラー (${res.status}): ${err.slice(0, 200)}`);
    return false;
  }

  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts || [];

  for (const part of parts) {
    if (part.inlineData) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      const path = `${OUTPUT_DIR}/${frame.name}.png`;
      writeFileSync(path, buffer);
      console.log(`   ✅ 保存: ${path} (${(buffer.length / 1024).toFixed(1)} KB)`);
      return true;
    }
  }

  console.error(`   ❌ 画像データが返されませんでした`);
  return false;
}

// メイン処理
console.log("🎬 ショート動画フレーム画像生成");
console.log("   テーマ: キッチンルール解説");
console.log(`   フレーム数: ${FRAMES.length}枚`);
console.log(`   推定コスト: ¥${FRAMES.length * 3}-${FRAMES.length * 6}`);
console.log(`   出力先: ${OUTPUT_DIR}/`);

mkdirSync(OUTPUT_DIR, { recursive: true });

let success = 0;
let fail = 0;

for (let i = 0; i < FRAMES.length; i++) {
  const ok = await generateFrame(FRAMES[i], i);
  if (ok) success++;
  else fail++;

  // レート制限回避
  if (i < FRAMES.length - 1) {
    await new Promise((r) => setTimeout(r, 3000));
  }
}

console.log(`\n============================`);
console.log(`📊 生成結果: 成功 ${success}枚 / 失敗 ${fail}枚`);
console.log(`💰 推定コスト: ¥${success * 3}-${success * 6}`);
console.log(`\n📁 画像ファイル: ${OUTPUT_DIR}/`);
console.log(`\n🎬 次のステップ:`);
console.log(`   1. VOICEVOX でナレーション音声を生成`);
console.log(`   2. CapCut で画像+音声を組み合わせて動画編集`);
console.log(`   3. テロップ・BGM・効果音を追加`);
console.log(`   4. YouTube Shorts にアップロード`);
console.log(`============================`);
