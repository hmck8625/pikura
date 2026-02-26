#!/usr/bin/env node

/**
 * generate-video-script.mjs
 *
 * ショート動画（YouTube Shorts / TikTok）の台本を自動生成するスクリプト。
 * Gemini 2.5 Flash（無料枠）を使用してテキスト生成を行う。
 *
 * 使い方:
 *   GEMINI_API_KEY=xxx node scripts/generate-video-script.mjs "キッチンルール解説"
 *   GEMINI_API_KEY=xxx node scripts/generate-video-script.mjs   # インタラクティブメニュー
 */

import readline from "node:readline";

// ============================================================
// 設定
// ============================================================

/** Gemini API エンドポイント */
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/** 事前定義トピックテンプレート */
const TOPIC_TEMPLATES = [
  {
    title: "キッチンルール解説",
    description: "「キッチンって何？」初心者向けルール解説",
  },
  {
    title: "サーブの打ち方",
    description: "正しいサーブフォームを3ステップで",
  },
  {
    title: "ダブルスのポジショニング",
    description: "初心者が間違えるポジション",
  },
  {
    title: "パドルの選び方30秒",
    description: "3つのポイントで解説",
  },
  {
    title: "ピックルボール vs テニス",
    description: "5つの違い",
  },
  {
    title: "スコアの数え方",
    description: "「0-0-2」って何？",
  },
  {
    title: "ディンクショットの基本",
    description: "上級者への第一歩",
  },
  {
    title: "大会に初参加する方法",
    description: "3ステップで解説",
  },
];

// ============================================================
// システムインストラクション（Gemini に渡すロール設定）
// ============================================================

const SYSTEM_INSTRUCTION = `あなたはプロのショート動画（YouTube Shorts / TikTok）台本ライターです。
日本のピックルボールコンテンツを専門としています。

ブランド: pikura.app — 日本のピックルボールプラットフォーム
ターゲット: 日本の初心者〜中級ピックルボールプレイヤー

以下のルールに従って台本を生成してください:

1. 尺は必ず30秒以内に収まるようにする
2. 日本語でカジュアルかつ分かりやすい口調を使う
3. 最初の3秒で視聴者を引きつけるフックを入れる
4. ピックルボール用語は初心者にも分かるように簡潔に説明する
5. CTAは必ず「pikura.app」への誘導にする
6. ナレーション、画面演出、テロップを具体的に指示する
7. テンポよくテキストを刻む（1文は短く）

出力フォーマットは以下の構造に厳密に従ってください:

============================
📹 ショート動画台本
テーマ: [テーマ名]
尺: 30秒
============================

🎬 オープニング (0-1秒)
[pikuraロゴ + ポップ音]

🪝 フック (1-4秒)
ナレーション: 「〇〇って知ってた？」
画面: [具体的な画面の説明]

📖 本編 (4-22秒)
ナレーション: [具体的なセリフ]
画面: [具体的な画面演出]
テロップ: [画面に表示するテキスト]

📝 まとめ (22-27秒)
ナレーション: [まとめのセリフ]
画面: [具体的な画面の説明]

📢 CTA (27-30秒)
ナレーション: 「詳しくはpikura.appで！」
画面: [pikura.app ロゴ + URL]

============================
📊 制作メモ
- 使用ツール: VOICEVOX (ナレーション), CapCut (編集)
- AI画像生成: [Geminiで生成すべき画像のリスト]
- 推定制作時間: 30-45分
============================

本編セクションは複数のサブパートに分割して、テンポよく構成してください。
各セクションのナレーション文字数は実際に30秒で読める量にしてください（日本語で約250〜300文字が目安）。`;

// ============================================================
// ユーティリティ関数
// ============================================================

/**
 * APIキーの存在を確認する
 * @returns {string} APIキー
 */
function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("\n[エラー] GEMINI_API_KEY 環境変数が設定されていません。");
    console.error("使い方: GEMINI_API_KEY=your_key node scripts/generate-video-script.mjs\n");
    process.exit(1);
  }
  return key;
}

/**
 * インタラクティブメニューを表示してトピックを選択させる
 * @returns {Promise<string>} 選択されたトピック
 */
function showInteractiveMenu() {
  return new Promise((resolve) => {
    console.log("\n============================");
    console.log("  ショート動画台本ジェネレーター");
    console.log("  pikura.app");
    console.log("============================\n");
    console.log("トピックを選んでください:\n");

    // テンプレート一覧を表示
    TOPIC_TEMPLATES.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.title} - ${t.description}`);
    });

    console.log(`\n  0. カスタムトピックを入力する\n`);

    // readline インターフェースで入力を受け取る
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("番号を入力 (0-8): ", (answer) => {
      const num = parseInt(answer.trim(), 10);

      // カスタムトピックの場合
      if (num === 0) {
        rl.question("トピックを入力してください: ", (custom) => {
          rl.close();
          resolve(custom.trim() || "ピックルボールの魅力");
        });
        return;
      }

      // テンプレートから選択
      if (num >= 1 && num <= TOPIC_TEMPLATES.length) {
        const selected = TOPIC_TEMPLATES[num - 1];
        console.log(`\n-> 選択: ${selected.title}\n`);
        rl.close();
        resolve(`${selected.title} - ${selected.description}`);
        return;
      }

      // 無効な入力の場合はデフォルトを使用
      console.log("\n-> 無効な入力です。デフォルトのトピックを使用します。\n");
      rl.close();
      resolve("キッチンルール解説 - 「キッチンって何？」初心者向けルール解説");
    });
  });
}

/**
 * Gemini API を呼び出して台本を生成する
 * @param {string} apiKey - Gemini APIキー
 * @param {string} topic - 動画のトピック/テーマ
 * @returns {Promise<string>} 生成された台本テキスト
 */
async function generateScript(apiKey, topic) {
  const url = `${GEMINI_URL}?key=${apiKey}`;

  // リクエストボディを構築
  const requestBody = {
    system_instruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    contents: [
      {
        parts: [
          {
            text: `以下のテーマでピックルボールのショート動画（30秒）の台本を生成してください。\n\nテーマ: ${topic}\n\nフォーマットに厳密に従い、具体的で実用的な台本を作成してください。`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 8192,
    },
  };

  console.log("Gemini API を呼び出し中...\n");

  // fetch で API を呼び出す（SDKは使わない）
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  // レスポンスのエラーハンドリング
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Gemini API エラー (${response.status}): ${errorBody}`
    );
  }

  const data = await response.json();

  // レスポンスからテキストを抽出
  const candidates = data.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error("Gemini API からの応答にコンテンツが含まれていません。");
  }

  const parts = candidates[0].content?.parts;
  if (!parts || parts.length === 0) {
    throw new Error("Gemini API のレスポンスにテキストパートがありません。");
  }

  return parts.map((p) => p.text).join("");
}

// ============================================================
// メイン処理
// ============================================================

async function main() {
  // APIキーを取得（なければエラー終了）
  const apiKey = getApiKey();

  // CLIの第1引数をトピックとして取得
  let topic = process.argv[2];

  // 引数がなければインタラクティブメニューを表示
  if (!topic) {
    topic = await showInteractiveMenu();
  }

  console.log(`\nトピック: ${topic}`);
  console.log("台本を生成しています...\n");

  try {
    // Gemini API で台本を生成
    const script = await generateScript(apiKey, topic);

    // 生成結果を表示
    console.log(script);

    // フッター情報
    console.log("\n============================");
    console.log("API使用: 1リクエスト（無料枠）");
    console.log(`モデル: ${GEMINI_MODEL}`);
    console.log("============================\n");
  } catch (error) {
    console.error(`\n[エラー] 台本の生成に失敗しました: ${error.message}`);

    // よくあるエラーのヒントを表示
    if (error.message.includes("401") || error.message.includes("403")) {
      console.error("-> APIキーが無効か期限切れの可能性があります。");
    } else if (error.message.includes("429")) {
      console.error("-> レート制限に達しました。しばらく待ってから再試行してください。");
    } else if (error.message.includes("fetch")) {
      console.error("-> ネットワーク接続を確認してください。");
    }

    process.exit(1);
  }
}

// スクリプト実行
main();
