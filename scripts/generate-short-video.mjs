/**
 * ショート動画（MP4）自動生成スクリプト
 *
 * フレーム画像 + ナレーション音声 + テロップを組み合わせて
 * YouTube Shorts 用の縦型動画（1080x1920）を自動生成します。
 *
 * 改善点:
 *   - ffprobe で実際の音声尺を測定し、シーン尺を自動調整
 *   - テロップに半透明背景ボックスを追加して視認性向上
 *   - speakingRate を自然な速度に調整
 *
 * 前提:
 *   - FFmpeg がインストール済み
 *   - Google Cloud Text-to-Speech API が有効
 *   - フレーム画像が存在
 *
 * 使い方:
 *   GEMINI_API_KEY=xxx node scripts/generate-short-video.mjs
 */

import { execSync } from "child_process";
import {
  writeFileSync,
  readFileSync,
  mkdirSync,
  rmSync,
  existsSync,
  readdirSync,
  statSync,
} from "fs";
import { resolve } from "path";

// ============================================================
// 定数・設定
// ============================================================

const TTS_API_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

const TTS_VOICE = {
  languageCode: "ja-JP",
  name: "ja-JP-Neural2-B",
};

const TTS_AUDIO_CONFIG = {
  audioEncoding: "MP3",
  speakingRate: 0.95, // 少しゆっくり（聞き取りやすさ重視）
};

const VIDEO_WIDTH = 1080;
const VIDEO_HEIGHT = 1920;

const IMAGE_DIR = "public/images/shorts/kitchen-rules";
const OUTPUT_DIR = "public/videos";
const OUTPUT_FILE = "kitchen-rules.mp4";
const TEMP_DIR = "temp";

/** ナレーション前後のパディング（秒） */
const AUDIO_PADDING = 0.3;

// ============================================================
// シーン定義
// minDuration: 音声がない場合 or 音声より短い場合の最低尺
// ============================================================

const SCENES = [
  { image: "00_logo.png", minDuration: 2, narration: null, telop: null },
  {
    image: "01_hook_kitchen.png",
    minDuration: 3,
    narration:
      "ピックルボールの「キッチン」って何のことか知ってる？",
    telop: "「キッチン」って何？",
  },
  {
    image: "02_court_nvz.png",
    minDuration: 4,
    narration:
      "これ、ネットの手前にあるエリアのことだよ。正式名称は、ノンボレーゾーン。",
    telop: "キッチン＝ノンボレーゾーン",
  },
  {
    image: "03_volley_ng.png",
    minDuration: 4,
    narration:
      "このエリアの中では、ボールをノーバウンドで打つ、ボレーは禁止されているんだ。",
    telop: "ボレー禁止！",
  },
  {
    image: "04_foot_fault.png",
    minDuration: 4,
    narration:
      "足がキッチンラインを少しでも踏んだり超えたりしたらファウルになるよ。",
    telop: "足がラインに触れてもNG！",
  },
  {
    image: "05_bounce_ok.png",
    minDuration: 4,
    narration:
      "でもね、ボールが一度バウンドした後は、キッチンに入って打ってもOK！",
    telop: "バウンド後はOK！",
  },
  {
    image: "06_strategy_dink.png",
    minDuration: 4,
    narration:
      "キッチンルールを理解すると、ゲームがもっと戦略的で面白くなるよ！",
    telop: "戦略が広がる！",
  },
  {
    image: "07_fun_players.png",
    minDuration: 5,
    narration:
      "最初は難しいけど、慣れればピックルボールがさらに楽しくなるよ！",
    telop: "ルールを覚えて楽しもう！",
  },
  {
    image: "08_cta_pikura.png",
    minDuration: 3,
    narration: "詳しくはピクラドットアップで！",
    telop: "pikura.app",
  },
];

// ============================================================
// ユーティリティ
// ============================================================

function exec(cmd, silent = true) {
  try {
    return execSync(cmd, {
      encoding: "utf-8",
      stdio: silent ? ["pipe", "pipe", "pipe"] : "inherit",
    });
  } catch (error) {
    throw new Error(
      `コマンド実行エラー: ${cmd}\n${error.stderr || error.message}`
    );
  }
}

function checkFfmpeg() {
  try {
    execSync("which ffmpeg", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/**
 * ffprobe で音声ファイルの実尺を取得する（秒）
 */
function getAudioDuration(audioPath) {
  try {
    const result = execSync(
      `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${audioPath}"`,
      { encoding: "utf-8" }
    ).trim();
    const duration = parseFloat(result);
    return Number.isNaN(duration) ? 0 : duration;
  } catch {
    return 0;
  }
}

function findJapaneseFont() {
  const candidates = [
    // WSL Windows フォント（品質が高い順）
    "/mnt/c/Windows/Fonts/meiryo.ttc",
    "/mnt/c/Windows/Fonts/YuGothR.ttc",
    "/mnt/c/Windows/Fonts/BIZ-UDGothicR.ttc",
    "/mnt/c/Windows/Fonts/msgothic.ttc",
    // Linux
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/google-noto-cjk/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/OTF/NotoSansCJKjp-Regular.otf",
    "/usr/local/share/fonts/NotoSansCJK-Regular.ttc",
  ];

  for (const fontPath of candidates) {
    if (existsSync(fontPath)) {
      return fontPath;
    }
  }

  try {
    const result = execSync("fc-list :lang=ja -f '%{file}\\n'", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const fonts = result.trim().split("\n").filter(Boolean);
    if (fonts.length > 0) return fonts[0];
  } catch {
    // fc-list が使えない
  }

  return null;
}

/**
 * drawtext 用エスケープ
 */
function escapeDrawtext(text) {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\\\\\\\")
    .replace(/'/g, "\u2019")
    .replace(/:/g, "\\:")
    .replace(/;/g, "\\;")
    .replace(/%/g, "%%");
}

// ============================================================
// TTS 音声生成
// ============================================================

async function generateTtsAudio(text, outputPath, apiKey) {
  const url = `${TTS_API_URL}?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text },
      voice: TTS_VOICE,
      audioConfig: TTS_AUDIO_CONFIG,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TTS API エラー (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  if (!data.audioContent) {
    throw new Error("TTS API: audioContent が返されませんでした");
  }

  const audioBuffer = Buffer.from(data.audioContent, "base64");
  writeFileSync(outputPath, audioBuffer);

  return true;
}

// ============================================================
// FFmpeg 動画生成
// ============================================================

/**
 * テロップ用の drawtext フィルターを構築する
 * 半透明背景ボックス + 白テキスト + 黒縁で視認性確保
 */
function buildTelopFilter(telop, fontPath) {
  if (!telop || !fontPath) return "";

  const escapedTelop = escapeDrawtext(telop);
  const fontSize = 56;
  const boxPadding = 16;
  const yPos = `h-h/5`;

  // 半透明黒背景ボックス + 白テキスト + 黒アウトライン
  return [
    `,drawtext=text='${escapedTelop}'`,
    `:fontfile='${fontPath}'`,
    `:fontsize=${fontSize}`,
    `:fontcolor=white`,
    `:borderw=3`,
    `:bordercolor=black@0.8`,
    `:box=1`,
    `:boxcolor=black@0.5`,
    `:boxborderw=${boxPadding}`,
    `:x=(w-text_w)/2`,
    `:y=${yPos}`,
  ].join("");
}

/**
 * 個別シーンの動画クリップを生成
 * @param {object} scene - シーン定義
 * @param {number} index - インデックス
 * @param {string} fontPath - フォントパス
 * @param {number} actualDuration - 実際のシーン尺（音声長に基づく）
 * @param {boolean} hasAudio - 音声あり
 */
function generateSceneClip(scene, index, fontPath, actualDuration, hasAudio) {
  const idx = String(index).padStart(2, "0");
  const imagePath = resolve(IMAGE_DIR, scene.image);
  const sceneVideoPath = resolve(TEMP_DIR, `scene_${idx}.mp4`);
  const audioPath = resolve(TEMP_DIR, `audio_${idx}.mp3`);
  const sceneAudioPath = resolve(TEMP_DIR, `scene_audio_${idx}.mp4`);

  if (!existsSync(imagePath)) {
    throw new Error(`画像が見つかりません: ${imagePath}`);
  }

  // ビデオフィルター
  let videoFilter = `scale=${VIDEO_WIDTH}:${VIDEO_HEIGHT}:force_original_aspect_ratio=decrease,pad=${VIDEO_WIDTH}:${VIDEO_HEIGHT}:(ow-iw)/2:(oh-ih)/2:black`;

  // テロップフィルター追加
  videoFilter += buildTelopFilter(scene.telop, fontPath);

  // 画像→動画（実尺で生成）
  const videoCmd = [
    "ffmpeg -y",
    `-loop 1 -i "${imagePath}"`,
    `-t ${actualDuration}`,
    `-vf "${videoFilter}"`,
    "-c:v libx264 -pix_fmt yuv420p -r 30",
    `"${sceneVideoPath}"`,
  ].join(" ");

  exec(videoCmd);

  if (hasAudio && existsSync(audioPath)) {
    // TTS音声（24kHz mono）を 44100Hz stereo に統一してマージ
    const audioCmd = [
      "ffmpeg -y",
      `-i "${sceneVideoPath}"`,
      `-i "${audioPath}"`,
      "-c:v copy -c:a aac -b:a 128k -ar 44100 -ac 2",
      `-t ${actualDuration}`,
      `"${sceneAudioPath}"`,
    ].join(" ");

    exec(audioCmd);
  } else {
    // 無音トラック（44100Hz stereo で統一）
    const silentCmd = [
      "ffmpeg -y",
      `-i "${sceneVideoPath}"`,
      `-f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100`,
      "-c:v copy -c:a aac -b:a 128k -ar 44100 -ac 2",
      `-t ${actualDuration}`,
      `"${sceneAudioPath}"`,
    ].join(" ");

    exec(silentCmd);
  }
}

function concatenateScenes(sceneCount, outputPath) {
  const fileListPath = resolve(TEMP_DIR, "filelist.txt");
  let fileListContent = "";

  for (let i = 0; i < sceneCount; i++) {
    const scenePath = resolve(
      TEMP_DIR,
      `scene_audio_${String(i).padStart(2, "0")}.mp4`
    );
    fileListContent += `file '${scenePath}'\n`;
  }

  writeFileSync(fileListPath, fileListContent);

  const concatCmd = [
    "ffmpeg -y",
    `-f concat -safe 0 -i "${fileListPath}"`,
    "-c copy",
    "-movflags +faststart",
    `"${outputPath}"`,
  ].join(" ");

  exec(concatCmd);
}

// ============================================================
// メイン処理
// ============================================================

async function main() {
  const startTime = Date.now();

  console.log("============================");
  console.log("  ショート動画 MP4 自動生成");
  console.log("  pikura.app");
  console.log("============================\n");

  // --- 事前チェック ---
  if (!checkFfmpeg()) {
    console.error("[エラー] FFmpeg がインストールされていません。");
    process.exit(1);
  }
  console.log("[OK] FFmpeg");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[エラー] GEMINI_API_KEY 環境変数が未設定");
    process.exit(1);
  }
  console.log("[OK] API キー");

  if (!existsSync(IMAGE_DIR)) {
    console.error(`[エラー] 画像ディレクトリなし: ${IMAGE_DIR}`);
    process.exit(1);
  }

  let missingImages = 0;
  for (const scene of SCENES) {
    if (!existsSync(resolve(IMAGE_DIR, scene.image))) {
      console.error(`  [不足] ${scene.image}`);
      missingImages++;
    }
  }
  if (missingImages > 0) {
    console.error(`[エラー] ${missingImages}枚の画像が不足`);
    process.exit(1);
  }
  console.log(`[OK] 全${SCENES.length}枚のフレーム画像`);

  const fontPath = findJapaneseFont();
  if (fontPath) {
    console.log(`[OK] フォント: ${fontPath}`);
  } else {
    console.warn("[警告] 日本語フォント未検出。テロップが崩れる可能性あり");
  }

  // --- 一時ディレクトリ準備 ---
  if (existsSync(TEMP_DIR)) rmSync(TEMP_DIR, { recursive: true });
  mkdirSync(TEMP_DIR, { recursive: true });
  mkdirSync(OUTPUT_DIR, { recursive: true });

  // ==========================================================
  // Step 1: TTS ナレーション音声生成
  // ==========================================================

  console.log("\n=== Step 1/3: ナレーション音声を生成 ===\n");

  let ttsAvailable = true;
  let ttsSuccess = 0;
  let ttsFailed = 0;
  const narrationCount = SCENES.filter((s) => s.narration).length;

  for (let i = 0; i < SCENES.length; i++) {
    const scene = SCENES[i];
    if (!scene.narration) {
      console.log(`  [${i + 1}/${SCENES.length}] ${scene.image} - スキップ`);
      continue;
    }

    const audioPath = resolve(TEMP_DIR, `audio_${String(i).padStart(2, "0")}.mp3`);

    try {
      if (!ttsAvailable) {
        console.log(`  [${i + 1}/${SCENES.length}] ${scene.image} - TTS無効`);
        ttsFailed++;
        continue;
      }

      console.log(`  [${i + 1}/${SCENES.length}] ${scene.image} - TTS生成中...`);
      await generateTtsAudio(scene.narration, audioPath, apiKey);

      const fileSizeKb = (statSync(audioPath).size / 1024).toFixed(1);
      const audioDur = getAudioDuration(audioPath).toFixed(1);
      console.log(`    -> ${audioPath} (${fileSizeKb} KB, ${audioDur}秒)`);
      ttsSuccess++;

      if (i < SCENES.length - 1) {
        await new Promise((r) => setTimeout(r, 300));
      }
    } catch (error) {
      if (error.message.includes("403") || error.message.includes("PERMISSION_DENIED")) {
        console.warn(`\n  [警告] TTS API 利用不可 (403)`);
        console.warn("  -> 音声なしの動画を生成します\n");
        ttsAvailable = false;
        ttsFailed++;
      } else {
        console.error(`    [エラー] ${error.message.slice(0, 200)}`);
        ttsFailed++;
      }
    }
  }

  console.log(`\n  TTS結果: 成功 ${ttsSuccess} / 失敗 ${ttsFailed}`);

  // ==========================================================
  // Step 2: シーン尺計算 + クリップ生成
  // ==========================================================

  console.log("\n=== Step 2/3: シーンクリップ生成（尺自動調整） ===\n");

  const actualDurations = [];

  for (let i = 0; i < SCENES.length; i++) {
    const scene = SCENES[i];
    const idx = String(i).padStart(2, "0");
    const audioPath = resolve(TEMP_DIR, `audio_${idx}.mp3`);
    const hasAudio = scene.narration !== null && existsSync(audioPath);

    // 実際のシーン尺を決定
    let actualDuration = scene.minDuration;
    if (hasAudio) {
      const audioDur = getAudioDuration(audioPath);
      // 音声尺 + パディング と minDuration の大きい方を採用
      actualDuration = Math.max(scene.minDuration, audioDur + AUDIO_PADDING);
      // 小数第1位に丸め
      actualDuration = Math.round(actualDuration * 10) / 10;
    }

    actualDurations.push(actualDuration);

    console.log(
      `  [${i + 1}/${SCENES.length}] ${scene.image} (${actualDuration}秒${hasAudio ? " +音声" : ""}${scene.telop ? " +テロップ" : ""})...`
    );

    try {
      generateSceneClip(scene, i, fontPath, actualDuration, hasAudio);
      console.log(`    -> OK`);
    } catch (error) {
      console.error(`    [エラー] ${error.message.slice(0, 300)}`);
      process.exit(1);
    }
  }

  // クリップ確認
  const sceneAudioFiles = readdirSync(TEMP_DIR).filter((f) =>
    f.startsWith("scene_audio_")
  );
  if (sceneAudioFiles.length !== SCENES.length) {
    console.error("[エラー] クリップ生成が不完全です");
    process.exit(1);
  }

  // ==========================================================
  // Step 3: 結合 → 最終MP4
  // ==========================================================

  console.log("\n=== Step 3/3: 結合して最終動画を生成 ===\n");

  const outputPath = resolve(OUTPUT_DIR, OUTPUT_FILE);

  try {
    concatenateScenes(SCENES.length, outputPath);
    console.log(`  -> 出力: ${outputPath}`);
  } catch (error) {
    console.error(`[エラー] 結合失敗: ${error.message}`);
    process.exit(1);
  }

  // 後片付け
  console.log("\n一時ファイルを削除中...");
  try {
    rmSync(TEMP_DIR, { recursive: true });
    console.log("  -> 削除完了");
  } catch {
    console.warn("  [警告] temp/ の手動削除が必要です");
  }

  // レポート
  const totalDuration = actualDurations.reduce((a, b) => a + b, 0).toFixed(1);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n============================");
  console.log("  生成完了！");
  console.log("============================");
  console.log(`  出力:     ${outputPath}`);
  console.log(`  動画尺:   ${totalDuration}秒`);
  console.log(`  解像度:   ${VIDEO_WIDTH}x${VIDEO_HEIGHT}`);
  console.log(`  TTS音声:  ${ttsSuccess}/${narrationCount} シーン`);
  console.log(`  処理時間: ${elapsed}秒`);
  console.log(`  コスト:   ¥0 (無料枠内)`);

  // 各シーンの尺内訳
  console.log(`\n  --- シーン別尺 ---`);
  for (let i = 0; i < SCENES.length; i++) {
    console.log(`  ${SCENES[i].image}: ${actualDurations[i]}秒`);
  }
  console.log("============================\n");
}

main().catch((error) => {
  console.error(`\n[致命的エラー] ${error.message}`);
  process.exit(1);
});
