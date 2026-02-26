/**
 * ショート動画（MP4）自動生成スクリプト
 *
 * フレーム画像 + ナレーション音声 + テロップを組み合わせて
 * YouTube Shorts 用の縦型動画（1080x1920, 30秒）を自動生成します。
 *
 * 前提:
 *   - FFmpeg がインストール済みであること
 *   - Google Cloud Text-to-Speech API が有効であること（GCPプロジェクト）
 *   - フレーム画像が public/images/shorts/kitchen-rules/ に存在すること
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

/** Google Cloud TTS API エンドポイント */
const TTS_API_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

/** TTS 音声設定 */
const TTS_VOICE = {
  languageCode: "ja-JP",
  name: "ja-JP-Neural2-B",
};

/** TTS オーディオ設定 */
const TTS_AUDIO_CONFIG = {
  audioEncoding: "MP3",
  speakingRate: 1.1,
};

/** 動画解像度（YouTube Shorts 9:16 縦型） */
const VIDEO_WIDTH = 1080;
const VIDEO_HEIGHT = 1920;

/** 画像ディレクトリ */
const IMAGE_DIR = "public/images/shorts/kitchen-rules";

/** 出力先ディレクトリ */
const OUTPUT_DIR = "public/videos";

/** 出力ファイル名 */
const OUTPUT_FILE = "kitchen-rules.mp4";

/** 一時ファイルディレクトリ */
const TEMP_DIR = "temp";

// ============================================================
// シーン定義（kitchen-rules 動画）
// ============================================================

const SCENES = [
  { image: "00_logo.png", duration: 1, narration: null, telop: null },
  {
    image: "01_hook_kitchen.png",
    duration: 3,
    narration:
      "ピックルボールの「キッチン」って何のことか知ってる？",
    telop: "「キッチン」って何？",
  },
  {
    image: "02_court_nvz.png",
    duration: 4,
    narration:
      "これ、ネットの手前にあるエリアのことだよ。正式名称は、ノンボレーゾーン。",
    telop: "キッチン＝ノンボレーゾーン",
  },
  {
    image: "03_volley_ng.png",
    duration: 4,
    narration:
      "このエリアの中では、ボールをノーバウンドで打つ、ボレーは禁止されているんだ。",
    telop: "ボレー禁止！",
  },
  {
    image: "04_foot_fault.png",
    duration: 4,
    narration:
      "足がキッチンラインを少しでも踏んだり超えたりしたらファウルになるよ。",
    telop: "足がラインに触れてもNG！",
  },
  {
    image: "05_bounce_ok.png",
    duration: 4,
    narration:
      "でもね、ボールが一度バウンドした後は、キッチンに入って打ってもOK！",
    telop: "バウンド後はOK！",
  },
  {
    image: "06_strategy_dink.png",
    duration: 2,
    narration:
      "キッチンルールを理解すると、ゲームがもっと戦略的で面白くなるよ！",
    telop: "戦略が広がる！",
  },
  {
    image: "07_fun_players.png",
    duration: 5,
    narration:
      "最初は難しいけど、慣れればピックルボールがさらに楽しくなるよ！",
    telop: "ルールを覚えて楽しもう！",
  },
  {
    image: "08_cta_pikura.png",
    duration: 3,
    narration: "詳しくはピクラドットアップで！",
    telop: "pikura.app",
  },
];

// ============================================================
// ユーティリティ関数
// ============================================================

/**
 * コマンドを実行し、結果を返す
 * @param {string} cmd - 実行するコマンド
 * @param {boolean} silent - 標準出力を抑制するかどうか
 * @returns {string} コマンドの標準出力
 */
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

/**
 * FFmpeg がインストールされているか確認する
 * @returns {boolean}
 */
function checkFfmpeg() {
  try {
    execSync("which ffmpeg", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/**
 * 日本語フォントのパスを検出する
 * @returns {string | null} フォントファイルのパス（見つからない場合は null）
 */
function findJapaneseFont() {
  // よくあるフォントパスを順番に試す
  const candidates = [
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/google-noto-cjk/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/truetype/fonts-japanese-gothic.ttf",
    "/usr/share/fonts/OTF/NotoSansCJKjp-Regular.otf",
    "/usr/share/fonts/truetype/noto/NotoSansCJKjp-Regular.otf",
    "/usr/local/share/fonts/NotoSansCJK-Regular.ttc",
    // Windows (WSL) のフォントパス
    "/mnt/c/Windows/Fonts/msgothic.ttc",
    "/mnt/c/Windows/Fonts/meiryo.ttc",
    "/mnt/c/Windows/Fonts/YuGothR.ttc",
    "/mnt/c/Windows/Fonts/BIZ-UDGothicR.ttc",
  ];

  for (const fontPath of candidates) {
    if (existsSync(fontPath)) {
      return fontPath;
    }
  }

  // fc-list で日本語フォントを検索する
  try {
    const result = execSync("fc-list :lang=ja -f '%{file}\\n'", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const fonts = result.trim().split("\n").filter(Boolean);
    if (fonts.length > 0) {
      return fonts[0];
    }
  } catch {
    // fc-list が使えない場合は無視
  }

  return null;
}

/**
 * drawtext フィルター用にテキストをエスケープする
 * FFmpeg の drawtext フィルターでは特殊文字のエスケープが必要
 * @param {string} text - エスケープ対象のテキスト
 * @returns {string} エスケープ済みテキスト
 */
function escapeDrawtext(text) {
  if (!text) return "";
  // FFmpeg drawtext で必要なエスケープ: コロン、バックスラッシュ、シングルクォート、セミコロン
  return text
    .replace(/\\/g, "\\\\\\\\")
    .replace(/'/g, "\u2019") // スマートクォートに置換（FFmpegの解析問題を回避）
    .replace(/:/g, "\\:")
    .replace(/;/g, "\\;")
    .replace(/%/g, "%%");
}

// ============================================================
// TTS 音声生成
// ============================================================

/**
 * Google Cloud Text-to-Speech API でナレーション音声を生成する
 * @param {string} text - ナレーションテキスト
 * @param {string} outputPath - 出力MP3ファイルパス
 * @param {string} apiKey - Google Cloud APIキー
 * @returns {Promise<boolean>} 成功したかどうか
 */
async function generateTtsAudio(text, outputPath, apiKey) {
  const url = `${TTS_API_URL}?key=${apiKey}`;

  const requestBody = {
    input: { text },
    voice: TTS_VOICE,
    audioConfig: TTS_AUDIO_CONFIG,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TTS API エラー (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  if (!data.audioContent) {
    throw new Error("TTS API: audioContent が返されませんでした");
  }

  // Base64 デコードしてファイルに保存
  const audioBuffer = Buffer.from(data.audioContent, "base64");
  writeFileSync(outputPath, audioBuffer);

  return true;
}

// ============================================================
// FFmpeg 動画生成
// ============================================================

/**
 * 個別シーンの動画クリップを生成する（テロップ付き）
 * @param {object} scene - シーン定義
 * @param {number} index - シーンのインデックス
 * @param {string} fontPath - 日本語フォントのパス
 * @param {boolean} hasAudio - 音声ファイルが存在するか
 */
function generateSceneClip(scene, index, fontPath, hasAudio) {
  const imagePath = resolve(IMAGE_DIR, scene.image);
  const sceneVideoPath = resolve(TEMP_DIR, `scene_${String(index).padStart(2, "0")}.mp4`);
  const audioPath = resolve(TEMP_DIR, `audio_${String(index).padStart(2, "0")}.mp3`);
  const sceneAudioPath = resolve(
    TEMP_DIR,
    `scene_audio_${String(index).padStart(2, "0")}.mp4`
  );

  // 画像の存在確認
  if (!existsSync(imagePath)) {
    throw new Error(`画像が見つかりません: ${imagePath}`);
  }

  // ビデオフィルターの構築
  let videoFilter = `scale=${VIDEO_WIDTH}:${VIDEO_HEIGHT}:force_original_aspect_ratio=decrease,pad=${VIDEO_WIDTH}:${VIDEO_HEIGHT}:(ow-iw)/2:(oh-ih)/2:black`;

  // テロップがある場合は drawtext フィルターを追加
  if (scene.telop && fontPath) {
    const escapedTelop = escapeDrawtext(scene.telop);
    videoFilter += `,drawtext=text='${escapedTelop}':fontfile='${fontPath}':fontsize=60:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h-h/6`;
  }

  // シーン動画を生成（画像からループ動画を作成）
  const videoCmd = [
    "ffmpeg -y",
    `-loop 1 -i "${imagePath}"`,
    `-t ${scene.duration}`,
    `-vf "${videoFilter}"`,
    "-c:v libx264",
    "-pix_fmt yuv420p",
    "-r 30",
    `"${sceneVideoPath}"`,
  ].join(" ");

  exec(videoCmd);

  // 音声がある場合は映像と音声を合成
  if (hasAudio && existsSync(audioPath)) {
    const audioCmd = [
      "ffmpeg -y",
      `-i "${sceneVideoPath}"`,
      `-i "${audioPath}"`,
      "-c:v copy",
      "-c:a aac -b:a 128k",
      "-shortest",
      `"${sceneAudioPath}"`,
    ].join(" ");

    exec(audioCmd);
  } else {
    // 音声がない場合は無音トラックを追加（concat 時にエラーにならないように）
    const silentCmd = [
      "ffmpeg -y",
      `-i "${sceneVideoPath}"`,
      `-f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100`,
      "-c:v copy",
      "-c:a aac -b:a 128k",
      `-t ${scene.duration}`,
      `"${sceneAudioPath}"`,
    ].join(" ");

    exec(silentCmd);
  }
}

/**
 * 全シーンを結合して最終動画を生成する
 * @param {number} sceneCount - シーン数
 * @param {string} outputPath - 出力MP4ファイルパス
 */
function concatenateScenes(sceneCount, outputPath) {
  // concat 用のファイルリストを作成
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

  // 全シーンを結合
  const concatCmd = [
    "ffmpeg -y",
    `-f concat -safe 0 -i "${fileListPath}"`,
    "-c:v libx264 -c:a aac",
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

  // ----------------------------------------------------------
  // 事前チェック
  // ----------------------------------------------------------

  // FFmpeg の存在確認
  if (!checkFfmpeg()) {
    console.error("[エラー] FFmpeg がインストールされていません。");
    console.error("インストール方法:");
    console.error("  Ubuntu/WSL: sudo apt install ffmpeg");
    console.error("  macOS:      brew install ffmpeg");
    process.exit(1);
  }
  console.log("[OK] FFmpeg を検出しました");

  // API キーの確認
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[エラー] GEMINI_API_KEY 環境変数が設定されていません。");
    console.error(
      "使い方: GEMINI_API_KEY=xxx node scripts/generate-short-video.mjs"
    );
    process.exit(1);
  }
  console.log("[OK] API キーを検出しました");

  // 画像ディレクトリの確認
  if (!existsSync(IMAGE_DIR)) {
    console.error(`[エラー] 画像ディレクトリが見つかりません: ${IMAGE_DIR}`);
    console.error(
      "先にフレーム画像を生成してください: node scripts/generate-short-frames.mjs"
    );
    process.exit(1);
  }

  // 全フレーム画像の存在確認
  let missingImages = 0;
  for (const scene of SCENES) {
    const imgPath = resolve(IMAGE_DIR, scene.image);
    if (!existsSync(imgPath)) {
      console.error(`  [不足] ${scene.image}`);
      missingImages++;
    }
  }
  if (missingImages > 0) {
    console.error(
      `\n[エラー] ${missingImages}枚の画像が不足しています。先にフレーム画像を生成してください。`
    );
    process.exit(1);
  }
  console.log(`[OK] 全${SCENES.length}枚のフレーム画像を確認しました`);

  // 日本語フォントの検出
  const fontPath = findJapaneseFont();
  if (fontPath) {
    console.log(`[OK] 日本語フォントを検出: ${fontPath}`);
  } else {
    console.warn(
      "[警告] 日本語フォントが見つかりません。テロップが正しく表示されない可能性があります。"
    );
    console.warn(
      "  インストール: sudo apt install fonts-noto-cjk"
    );
  }

  // 合計尺を計算して表示
  const totalDuration = SCENES.reduce((sum, s) => sum + s.duration, 0);
  const narrationCount = SCENES.filter((s) => s.narration).length;
  console.log(`\n--- 動画スペック ---`);
  console.log(`  解像度:     ${VIDEO_WIDTH}x${VIDEO_HEIGHT} (9:16 縦型)`);
  console.log(`  合計尺:     ${totalDuration}秒`);
  console.log(`  シーン数:   ${SCENES.length}`);
  console.log(`  ナレーション: ${narrationCount}シーン`);
  console.log(`  コーデック:  H.264 + AAC`);
  console.log(`-------------------\n`);

  // ----------------------------------------------------------
  // Step 0: 一時ディレクトリの準備
  // ----------------------------------------------------------

  if (existsSync(TEMP_DIR)) {
    rmSync(TEMP_DIR, { recursive: true });
  }
  mkdirSync(TEMP_DIR, { recursive: true });

  // 出力ディレクトリの作成
  mkdirSync(OUTPUT_DIR, { recursive: true });

  // ----------------------------------------------------------
  // Step 1: TTS ナレーション音声の生成
  // ----------------------------------------------------------

  console.log("=== Step 1/4: ナレーション音声を生成 ===\n");

  let ttsAvailable = true;
  let ttsSuccess = 0;
  let ttsFailed = 0;

  for (let i = 0; i < SCENES.length; i++) {
    const scene = SCENES[i];

    if (!scene.narration) {
      console.log(
        `  [${i + 1}/${SCENES.length}] ${scene.image} - ナレーションなし（スキップ）`
      );
      continue;
    }

    const audioPath = resolve(
      TEMP_DIR,
      `audio_${String(i).padStart(2, "0")}.mp3`
    );

    try {
      if (!ttsAvailable) {
        // TTS が使えない場合はスキップ
        console.log(
          `  [${i + 1}/${SCENES.length}] ${scene.image} - TTS無効のためスキップ`
        );
        ttsFailed++;
        continue;
      }

      console.log(
        `  [${i + 1}/${SCENES.length}] ${scene.image} - TTS生成中...`
      );
      await generateTtsAudio(scene.narration, audioPath, apiKey);

      const fileSizeKb = (statSync(audioPath).size / 1024).toFixed(1);
      console.log(`    -> 保存: ${audioPath} (${fileSizeKb} KB)`);
      ttsSuccess++;

      // レート制限回避のため少し待つ
      if (i < SCENES.length - 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch (error) {
      if (
        error.message.includes("403") ||
        error.message.includes("PERMISSION_DENIED")
      ) {
        console.warn(
          `\n  [警告] TTS API が利用できません (403 Forbidden)`
        );
        console.warn(
          "  -> Cloud Text-to-Speech API を GCP コンソールで有効にしてください:"
        );
        console.warn(
          "     https://console.cloud.google.com/apis/library/texttospeech.googleapis.com"
        );
        console.warn(
          "  -> 音声なし（画像＋テロップのみ）の動画を生成します。\n"
        );
        ttsAvailable = false;
        ttsFailed++;
      } else {
        console.error(
          `    [エラー] TTS 生成失敗: ${error.message.slice(0, 200)}`
        );
        ttsFailed++;
      }
    }
  }

  console.log(
    `\n  TTS結果: 成功 ${ttsSuccess} / 失敗 ${ttsFailed} / スキップ ${SCENES.length - narrationCount}`
  );

  // ----------------------------------------------------------
  // Step 2 & 3: 個別シーン動画の生成（画像 + テロップ + 音声合成）
  // ----------------------------------------------------------

  console.log("\n=== Step 2/4: シーン動画クリップを生成 ===\n");

  for (let i = 0; i < SCENES.length; i++) {
    const scene = SCENES[i];
    const hasAudio =
      scene.narration !== null &&
      existsSync(
        resolve(TEMP_DIR, `audio_${String(i).padStart(2, "0")}.mp3`)
      );

    console.log(
      `  [${i + 1}/${SCENES.length}] ${scene.image} (${scene.duration}秒${hasAudio ? " + 音声" : ""}${scene.telop ? " + テロップ" : ""})...`
    );

    try {
      generateSceneClip(scene, i, fontPath, hasAudio);
      console.log(`    -> OK`);
    } catch (error) {
      console.error(`    [エラー] ${error.message.slice(0, 300)}`);
      process.exit(1);
    }
  }

  // ----------------------------------------------------------
  // Step 3: 音声付きシーンの確認（ログのみ）
  // ----------------------------------------------------------

  console.log("\n=== Step 3/4: 音声合成完了を確認 ===\n");

  const sceneAudioFiles = readdirSync(TEMP_DIR).filter((f) =>
    f.startsWith("scene_audio_")
  );
  console.log(`  生成されたクリップ数: ${sceneAudioFiles.length}/${SCENES.length}`);

  if (sceneAudioFiles.length !== SCENES.length) {
    console.error("[エラー] 一部のシーンクリップが生成されませんでした。");
    process.exit(1);
  }

  // ----------------------------------------------------------
  // Step 4: 全シーンの結合 -> 最終MP4出力
  // ----------------------------------------------------------

  console.log("\n=== Step 4/4: 全シーンを結合して最終動画を生成 ===\n");

  const outputPath = resolve(OUTPUT_DIR, OUTPUT_FILE);

  try {
    concatenateScenes(SCENES.length, outputPath);
    console.log(`  -> 出力: ${outputPath}`);
  } catch (error) {
    console.error(`[エラー] 動画結合に失敗: ${error.message}`);
    process.exit(1);
  }

  // ----------------------------------------------------------
  // 後片付け: 一時ファイルの削除
  // ----------------------------------------------------------

  console.log("\n一時ファイルを削除中...");
  try {
    rmSync(TEMP_DIR, { recursive: true });
    console.log("  -> 削除完了");
  } catch {
    console.warn("  [警告] 一時ファイルの削除に失敗しました。手動で削除してください: " + TEMP_DIR);
  }

  // ----------------------------------------------------------
  // 完了レポート
  // ----------------------------------------------------------

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n============================");
  console.log("  生成完了！");
  console.log("============================");
  console.log(`  出力ファイル: ${outputPath}`);
  console.log(`  動画尺:       ${totalDuration}秒`);
  console.log(`  解像度:       ${VIDEO_WIDTH}x${VIDEO_HEIGHT}`);
  console.log(`  TTS音声:      ${ttsSuccess}/${narrationCount} シーン`);
  console.log(`  処理時間:     ${elapsed}秒`);
  console.log("");
  console.log("--- コスト ---");
  console.log(
    `  TTS API:  ${ttsSuccess > 0 ? "無料枠 (100万文字/月まで無料)" : "未使用"}`
  );
  console.log(`  合計:     ¥0 (無料枠内)`);
  console.log("============================");
  console.log("");
  console.log("次のステップ:");
  console.log("  1. 動画を確認:  open " + outputPath);
  console.log("  2. BGM・効果音を追加（任意）");
  console.log("  3. YouTube Shorts にアップロード");
  console.log("============================\n");
}

// スクリプト実行
main().catch((error) => {
  console.error(`\n[致命的エラー] ${error.message}`);
  process.exit(1);
});
