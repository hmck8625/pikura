/**
 * 記事→ショート動画 統合パイプライン
 *
 * 記事スラッグを指定すると、以下を自動実行:
 *   1. 記事内容からGemini APIで動画台本（ストーリーボード）を生成
 *   2. 各シーンのフレーム画像を Gemini Image API で生成
 *   3. Google Cloud TTS でナレーション音声を生成
 *   4. FFmpeg で画像+テロップ+音声を結合し MP4 出力
 *
 * 使い方:
 *   GEMINI_API_KEY=xxx node scripts/article-to-short.mjs <article-slug>
 *   GEMINI_API_KEY=xxx node scripts/article-to-short.mjs pickleball-rules
 *   GEMINI_API_KEY=xxx node scripts/article-to-short.mjs --topic "ピックルボールの始め方"
 *
 * コスト:
 *   - 台本生成: ¥0（テキストAPI無料枠）
 *   - 画像生成: ¥27-54（9枚 × ¥3-6）
 *   - TTS音声: ¥0（月100万文字無料）
 *   - 合計: ¥27-54
 */

import { execSync } from "child_process";
import {
  writeFileSync,
  readFileSync,
  mkdirSync,
  rmSync,
  existsSync,
  statSync,
} from "fs";
import { resolve } from "path";
import { createInterface } from "readline";

// ============================================================
// 定数
// ============================================================

const API_KEY = process.env.GEMINI_API_KEY;
const TEXT_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
const IMAGE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`;
const TTS_API_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

const VIDEO_WIDTH = 1080;
const VIDEO_HEIGHT = 1920;
const AUDIO_PADDING = 0.3;

const STYLE_DIRECTIVE = [
  "Modern flat vector illustration style.",
  "Clean geometric shapes, bold outlines, bright vibrant colors.",
  "Consistent color palette: Sky Blue #0EA5E9, Emerald Green #10B981, Amber #F59E0B, Dark Navy #0f172a.",
  "Vertical 9:16 format for mobile video.",
  "IMPORTANT: Absolutely no text, no letters, no words, no numbers, no writing, no characters of any language in the image. Pure illustration only.",
].join(" ");

// ============================================================
// 記事データ（フォールバック用）
// ============================================================

const ARTICLES = {
  "what-is-pickleball": {
    title: "ピックルボールとは？初心者向け完全ガイド",
    summary:
      "テニス・バドミントン・卓球の要素を組み合わせたラケットスポーツ。1965年アメリカ生まれ。パドルとプラスチックボールを使い、バドミントン大のコートでプレー。ルールがシンプルで幅広い年齢層が楽しめる。",
  },
  "how-to-start-pickleball": {
    title: "ピックルボールの始め方",
    summary:
      "パドル（5000-15000円）、屋内用ボール、コートシューズの3点を揃える。体育館やテニスコート併設施設で体験会に参加。基本ルール（サーブ・キッチン・ダブルバウンスルール）を覚えてから実践。",
  },
  "pickleball-rules": {
    title: "ピックルボールのルール完全解説",
    summary:
      "サーブは対角線にアンダーハンド。スコアは3桁コール。キッチン（NVZ）ではボレー禁止。ダブルバウンスルール：サーブとリターンは必ずワンバウンド。11点先取、2点差で勝利。",
  },
  "paddle-guide": {
    title: "ピックルボールパドルおすすめ10選",
    summary:
      "素材はグラファイト・カーボン・ファイバーグラスの3種。重さは7-8.5oz。初心者はミッドウェイト（7.5-8oz）がおすすめ。JOOLA, Selkirk, Franklinが人気。予算5000-25000円。",
  },
  "tokyo-pickleball-courts": {
    title: "東京でピックルボールができる場所",
    summary:
      "池袋・渋谷・お台場などに専用/併設コートあり。体育館の一般開放日を活用。各地のピックルボールクラブの体験会に参加するのが手軽。料金は1回500-2000円程度。",
  },
  "doubles-tactics": {
    title: "ダブルス戦術ガイド",
    summary:
      "3rdショットドロップでキッチンラインへ前進。ディンク戦で相手のミスを誘う。スタッキングでフォアハンド側を確保。ポーチで攻めのボレー。コミュニケーションが最重要。",
  },
  "court-size-setup": {
    title: "コートのサイズ・寸法と設営方法",
    summary:
      "コートは6.1m×13.4m。キッチンはネットから2.13m。ネット高は中央86cm、端91cm。テニスコート1面から2-4面取れる。体育館ではバドミントンコートのラインを活用。",
  },
  "shoes-guide": {
    title: "シューズおすすめ8選",
    summary:
      "インドアはノンマーキングソール必須。アウトドアは耐久性重視。ミズノ・アシックス・ヨネックスが日本で入手しやすい。テニスシューズやバドミントンシューズで代用可。予算5000-15000円。",
  },
  "first-tournament-guide": {
    title: "初めてのピックルボール大会参加ガイド",
    summary:
      "JPA公式大会はレベル別（ビギナー/ミドル/オープン）。エントリーはJPA公式サイトから。持ち物：パドル、シューズ、タオル、飲み物。当日は受付→ウォームアップ→試合。初心者大会から始めるのがおすすめ。",
  },
  "jpa-ranking-explained": {
    title: "JPA公式ランキングの仕組み",
    summary:
      "2026年1月開始。JPA公式大会の成績でポイント付与。カテゴリ：男子/女子シングルス・ダブルス、混合ダブルス × 年齢区分(19+/35+/50+)。ポイントは直近12ヶ月の上位成績で計算。",
  },
};

// ============================================================
// ユーティリティ
// ============================================================

function confirm(message) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

function exec(cmd) {
  try {
    return execSync(cmd, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (error) {
    throw new Error(`コマンドエラー: ${cmd}\n${error.stderr || error.message}`);
  }
}

function getAudioDuration(audioPath) {
  try {
    const result = execSync(
      `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${audioPath}"`,
      { encoding: "utf-8" }
    ).trim();
    const d = parseFloat(result);
    return Number.isNaN(d) ? 0 : d;
  } catch {
    return 0;
  }
}

function findJapaneseFont() {
  const candidates = [
    "/mnt/c/Windows/Fonts/meiryo.ttc",
    "/mnt/c/Windows/Fonts/YuGothR.ttc",
    "/mnt/c/Windows/Fonts/BIZ-UDGothicR.ttc",
    "/mnt/c/Windows/Fonts/msgothic.ttc",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc",
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  try {
    const r = execSync("fc-list :lang=ja -f '%{file}\\n'", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const fonts = r.trim().split("\n").filter(Boolean);
    if (fonts.length > 0) return fonts[0];
  } catch {}
  return null;
}

function escapeDrawtext(text) {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\\\\\\\")
    .replace(/'/g, "\u2019")
    .replace(/:/g, "\\:")
    .replace(/;/g, "\\;")
    .replace(/%/g, "%%");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ============================================================
// Step 1: ストーリーボード生成（Gemini テキストAPI / 無料）
// ============================================================

async function generateStoryboard(title, summary) {
  console.log("\n=== Step 1/4: ストーリーボード生成（無料） ===\n");

  const systemPrompt = `あなたはYouTube Shortsの動画構成作家です。
与えられた記事の内容を元に、30-50秒のショート動画のストーリーボードをJSON形式で出力してください。

## ルール
- シーンは8-9個（ロゴ1秒 + 本編6-7シーン + エンドカード2秒）
- 各シーンには image_prompt（英語）, narration（日本語、話し言葉）, telop（日本語、短く）, min_duration（秒）を含める
- image_prompt は「フラットベクターイラスト、テキスト無し」のスタイルで統一
- narration は友達に教えるようなカジュアルなトーンで
- telop は画面に表示する短いキーワード（10文字以内）
- 最初のシーンはロゴ（ピックルボールのアイコン、ダークネイビー背景）
- 最後のシーンはエンドカード（ピックルボール、ダークネイビー背景）
- エンドカードの narration は "詳しくはピクラドットアップで！"、telop は "pikura.app"

## 出力形式（JSONのみ、他のテキスト不要）
{
  "scenes": [
    {
      "image_prompt": "A stylized pickleball on dark navy background...",
      "narration": null,
      "telop": null,
      "min_duration": 1
    },
    {
      "image_prompt": "...",
      "narration": "...",
      "telop": "...",
      "min_duration": 4
    }
  ]
}`;

  const userPrompt = `記事タイトル: ${title}\n\n記事の要約:\n${summary}`;

  const response = await fetch(TEXT_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: { maxOutputTokens: 4096 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API エラー: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // JSONを抽出（```json ... ``` で囲まれている場合も対応）
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("APIレスポンス:", text);
    throw new Error("ストーリーボードのJSON解析に失敗");
  }

  const storyboard = JSON.parse(jsonMatch[0]);
  console.log(`  シーン数: ${storyboard.scenes.length}`);

  for (let i = 0; i < storyboard.scenes.length; i++) {
    const s = storyboard.scenes[i];
    console.log(`  [${i + 1}] ${s.min_duration}秒 | テロップ: ${s.telop || "(なし)"}`);
  }

  return storyboard;
}

// ============================================================
// Step 2: フレーム画像生成（Gemini Image API / 有料）
// ============================================================

async function generateFrames(scenes, outputDir) {
  console.log("\n=== Step 2/4: フレーム画像生成（有料） ===\n");

  mkdirSync(outputDir, { recursive: true });
  let success = 0;

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const fileName = `${String(i).padStart(2, "0")}.png`;
    const filePath = resolve(outputDir, fileName);

    console.log(`  [${i + 1}/${scenes.length}] 生成中...`);

    // スタイルディレクティブを追加
    const fullPrompt = `${scene.image_prompt} ${STYLE_DIRECTIVE}`;

    try {
      const res = await fetch(IMAGE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: { aspectRatio: "9:16", imageSize: "1K" },
          },
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`    エラー (${res.status}): ${err.slice(0, 150)}`);
        continue;
      }

      const data = await res.json();
      const parts = data.candidates?.[0]?.content?.parts || [];

      let saved = false;
      for (const part of parts) {
        if (part.inlineData) {
          const buffer = Buffer.from(part.inlineData.data, "base64");
          writeFileSync(filePath, buffer);
          console.log(
            `    -> ${fileName} (${(buffer.length / 1024).toFixed(1)} KB)`
          );
          success++;
          saved = true;
          break;
        }
      }

      if (!saved) {
        console.error(`    画像データなし`);
      }
    } catch (error) {
      console.error(`    エラー: ${error.message.slice(0, 150)}`);
    }

    if (i < scenes.length - 1) await sleep(3000);
  }

  console.log(`\n  画像生成結果: ${success}/${scenes.length}枚`);
  console.log(`  推定コスト: ¥${success * 3}-${success * 6}`);

  return success;
}

// ============================================================
// Step 3: TTS音声生成 + Step 4: 動画組み立て
// ============================================================

async function generateVideo(scenes, imageDir, outputPath, apiKey) {
  const tempDir = "temp";
  if (existsSync(tempDir)) rmSync(tempDir, { recursive: true });
  mkdirSync(tempDir, { recursive: true });

  const fontPath = findJapaneseFont();
  if (fontPath) {
    console.log(`  フォント: ${fontPath}`);
  }

  // --- TTS ---
  console.log("\n=== Step 3/4: TTS ナレーション生成（無料） ===\n");

  let ttsAvailable = true;
  let ttsSuccess = 0;

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    if (!scene.narration) {
      console.log(`  [${i + 1}/${scenes.length}] スキップ`);
      continue;
    }

    const audioPath = resolve(tempDir, `audio_${String(i).padStart(2, "0")}.mp3`);

    if (!ttsAvailable) {
      console.log(`  [${i + 1}/${scenes.length}] TTS無効`);
      continue;
    }

    try {
      console.log(`  [${i + 1}/${scenes.length}] TTS生成中...`);
      const res = await fetch(`${TTS_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text: scene.narration },
          voice: { languageCode: "ja-JP", name: "ja-JP-Neural2-B" },
          audioConfig: { audioEncoding: "MP3", speakingRate: 0.95 },
        }),
      });

      if (!res.ok) {
        if (res.status === 403) {
          console.warn("  [警告] TTS API 利用不可。音声なしで続行。");
          ttsAvailable = false;
          continue;
        }
        throw new Error(`TTS API ${res.status}`);
      }

      const data = await res.json();
      if (data.audioContent) {
        writeFileSync(audioPath, Buffer.from(data.audioContent, "base64"));
        const dur = getAudioDuration(audioPath).toFixed(1);
        console.log(`    -> ${dur}秒`);
        ttsSuccess++;
      }
      await sleep(300);
    } catch (error) {
      console.error(`    エラー: ${error.message.slice(0, 150)}`);
    }
  }

  // --- 動画組み立て ---
  console.log("\n=== Step 4/4: 動画組み立て ===\n");

  const actualDurations = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const idx = String(i).padStart(2, "0");
    const imagePath = resolve(imageDir, `${idx}.png`);
    const audioPath = resolve(tempDir, `audio_${idx}.mp3`);
    const sceneVideoPath = resolve(tempDir, `scene_${idx}.mp4`);
    const sceneAudioPath = resolve(tempDir, `scene_audio_${idx}.mp4`);

    if (!existsSync(imagePath)) {
      console.error(`  [エラー] 画像なし: ${imagePath}`);
      process.exit(1);
    }

    const hasAudio = scene.narration && existsSync(audioPath);

    // 実尺計算
    let actualDuration = scene.min_duration;
    if (hasAudio) {
      const audioDur = getAudioDuration(audioPath);
      actualDuration = Math.max(scene.min_duration, audioDur + AUDIO_PADDING);
      actualDuration = Math.round(actualDuration * 10) / 10;
    }
    actualDurations.push(actualDuration);

    // ビデオフィルター
    let vf = `scale=${VIDEO_WIDTH}:${VIDEO_HEIGHT}:force_original_aspect_ratio=decrease,pad=${VIDEO_WIDTH}:${VIDEO_HEIGHT}:(ow-iw)/2:(oh-ih)/2:black`;

    if (scene.telop && fontPath) {
      const escaped = escapeDrawtext(scene.telop);
      vf += `,drawtext=text='${escaped}':fontfile='${fontPath}':fontsize=56:fontcolor=white:borderw=3:bordercolor=black@0.8:box=1:boxcolor=black@0.5:boxborderw=16:x=(w-text_w)/2:y=h-h/5`;
    }

    console.log(`  [${i + 1}/${scenes.length}] ${actualDuration}秒${hasAudio ? " +音声" : ""}${scene.telop ? " +テロップ" : ""}...`);

    // 画像→動画
    exec(
      `ffmpeg -y -loop 1 -i "${imagePath}" -t ${actualDuration} -vf "${vf}" -c:v libx264 -pix_fmt yuv420p -r 30 "${sceneVideoPath}"`
    );

    // 音声マージ or 無音追加（全て 44100Hz stereo AAC に統一）
    if (hasAudio) {
      exec(
        `ffmpeg -y -i "${sceneVideoPath}" -i "${audioPath}" -c:v copy -c:a aac -b:a 128k -ar 44100 -ac 2 -t ${actualDuration} "${sceneAudioPath}"`
      );
    } else {
      exec(
        `ffmpeg -y -i "${sceneVideoPath}" -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 -c:v copy -c:a aac -b:a 128k -ar 44100 -ac 2 -t ${actualDuration} "${sceneAudioPath}"`
      );
    }
    console.log(`    -> OK`);
  }

  // 結合
  console.log("\n  全シーンを結合中...");
  const fileList = scenes
    .map((_, i) =>
      `file '${resolve(tempDir, `scene_audio_${String(i).padStart(2, "0")}.mp4`)}'`
    )
    .join("\n");
  const fileListPath = resolve(tempDir, "filelist.txt");
  writeFileSync(fileListPath, fileList);

  mkdirSync(resolve(outputPath, ".."), { recursive: true });
  exec(
    `ffmpeg -y -f concat -safe 0 -i "${fileListPath}" -c:v libx264 -c:a aac -movflags +faststart "${outputPath}"`
  );

  // 後片付け
  try {
    rmSync(tempDir, { recursive: true });
  } catch {}

  const totalDuration = actualDurations.reduce((a, b) => a + b, 0).toFixed(1);

  return { totalDuration, ttsSuccess, actualDurations };
}

// ============================================================
// メイン
// ============================================================

async function main() {
  if (!API_KEY) {
    console.error("GEMINI_API_KEY 環境変数が未設定です");
    process.exit(1);
  }

  try {
    execSync("which ffmpeg", { stdio: "pipe" });
  } catch {
    console.error("FFmpeg がインストールされていません");
    process.exit(1);
  }

  const args = process.argv.slice(2);

  let articleTitle = "";
  let articleSummary = "";
  let outputName = "";

  if (args[0] === "--topic") {
    // カスタムトピック
    const topic = args.slice(1).join(" ");
    if (!topic) {
      console.error("使い方: ... --topic \"トピック名\"");
      process.exit(1);
    }
    articleTitle = topic;
    articleSummary = topic;
    outputName = topic
      .replace(/[^a-zA-Z0-9ぁ-んァ-ヶ一-龥]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 30);
  } else {
    // 記事スラッグ
    const slug = args[0];
    if (!slug) {
      console.error("使い方:");
      console.error("  GEMINI_API_KEY=xxx node scripts/article-to-short.mjs <article-slug>");
      console.error("  GEMINI_API_KEY=xxx node scripts/article-to-short.mjs --topic \"トピック\"");
      console.error(`\n有効な記事スラッグ:`);
      for (const [slug, article] of Object.entries(ARTICLES)) {
        console.error(`  - ${slug}: ${article.title}`);
      }
      process.exit(1);
    }

    const article = ARTICLES[slug];
    if (!article) {
      console.error(`記事が見つかりません: "${slug}"`);
      console.error(`有効なスラッグ: ${Object.keys(ARTICLES).join(", ")}`);
      process.exit(1);
    }

    articleTitle = article.title;
    articleSummary = article.summary;
    outputName = slug;
  }

  const imageDir = `public/images/shorts/${outputName}`;
  const outputPath = `public/videos/${outputName}.mp4`;

  console.log("============================");
  console.log("  記事→ショート動画 パイプライン");
  console.log("============================");
  console.log(`  記事: ${articleTitle}`);
  console.log(`  画像: ${imageDir}/`);
  console.log(`  出力: ${outputPath}`);
  console.log(`  推定コスト: ¥27-54（画像9枚）+ TTS無料`);
  console.log("============================\n");

  const ok = await confirm("生成を開始しますか？");
  if (!ok) {
    console.log("キャンセル");
    process.exit(0);
  }

  const startTime = Date.now();

  // Step 1: ストーリーボード
  const storyboard = await generateStoryboard(articleTitle, articleSummary);

  // Step 2: フレーム画像
  const imageCount = await generateFrames(storyboard.scenes, imageDir);
  if (imageCount < storyboard.scenes.length) {
    console.warn(`[警告] 一部画像の生成に失敗（${imageCount}/${storyboard.scenes.length}）`);
  }

  // Step 3 & 4: TTS + 動画組み立て
  const result = await generateVideo(
    storyboard.scenes,
    imageDir,
    outputPath,
    API_KEY
  );

  // ストーリーボードをJSONで保存（再利用用）
  const storyboardPath = `${imageDir}/storyboard.json`;
  writeFileSync(storyboardPath, JSON.stringify(storyboard, null, 2));

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);

  console.log("\n============================");
  console.log("  完了！");
  console.log("============================");
  console.log(`  出力: ${outputPath}`);
  console.log(`  動画尺: ${result.totalDuration}秒`);
  console.log(`  TTS音声: ${result.ttsSuccess}シーン`);
  console.log(`  画像: ${imageCount}枚`);
  console.log(`  処理時間: ${elapsed}秒`);
  console.log(`  推定コスト: ¥${imageCount * 3}-${imageCount * 6}`);
  console.log("============================\n");
}

main().catch((error) => {
  console.error(`[致命的エラー] ${error.message}`);
  process.exit(1);
});
