/**
 * ツイート候補生成スクリプト
 *
 * Gemini 2.5 Flash（無料枠）を使って、@pikura_app 用の
 * ツイート候補を5カテゴリ分生成します。
 *
 * 使い方:
 *   GEMINI_API_KEY=xxxxx node scripts/generate-tweets.mjs
 *
 * 生成カテゴリ:
 *   1. ランキング紹介 - トップ選手のスポットライト
 *   2. ルール豆知識   - 「知ってた？」フック付きトリビア
 *   3. 記事紹介       - 記事の要約＋リンク
 *   4. コミュニティ   - 質問・投票形式のエンゲージメント
 *   5. 大会情報       - ピックルボール大会・イベント情報
 */

// ---------------------------------------------------------------------------
// 環境変数チェック
// ---------------------------------------------------------------------------
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("GEMINI_API_KEY が未設定です");
  console.error("");
  console.error("使い方:");
  console.error("  GEMINI_API_KEY=xxxxx node scripts/generate-tweets.mjs");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 記事データ（import-articles.mjs と同一の記事リスト）
// ---------------------------------------------------------------------------
const ARTICLES = [
  { slug: "what-is-pickleball", title: "ピックルボールとは？初心者向け完全ガイド" },
  { slug: "how-to-start-pickleball", title: "ピックルボールの始め方" },
  { slug: "pickleball-rules", title: "ピックルボールのルール完全解説" },
  { slug: "paddle-guide", title: "パドルおすすめ10選" },
  { slug: "tokyo-pickleball-courts", title: "東京でピックルボールができる場所まとめ" },
  { slug: "doubles-tactics", title: "ダブルス戦術ガイド" },
  { slug: "court-size-setup", title: "コートのサイズ・寸法と設営方法" },
  { slug: "shoes-guide", title: "シューズおすすめ8選" },
  { slug: "first-tournament-guide", title: "初めてのピックルボール大会参加ガイド" },
  { slug: "jpa-ranking-explained", title: "JPA公式ランキングの仕組み" },
  { slug: "serve-basics", title: "ピックルボールのサーブ基本3種類" },
  { slug: "dink-basics", title: "ディンクとは？30秒解説" },
  { slug: "pickleball-vs-tennis", title: "ピックルボール vs テニス 5つの違い" },
  { slug: "dupr-japan", title: "DUPRって何？日本で使えるの？" },
  { slug: "third-shot-drop", title: "3rdショットドロップ 初心者向け" },
  { slug: "doubles-position", title: "ダブルスの基本ポジション" },
  { slug: "osaka-pickleball", title: "大阪でピックルボールできる場所TOP3" },
  { slug: "app-japan-open", title: "APP JAPAN Open ハイライト" },
  { slug: "kitchen-rule-simple", title: "キッチンルール これだけ覚えればOK" },
  { slug: "kitchen-rules", title: "キッチンルール完全ガイド" },
];

// ---------------------------------------------------------------------------
// トップ選手データ（lib/ranking/data.ts より抜粋）
// ---------------------------------------------------------------------------
const TOP_PLAYERS = [
  { name: "東村 大祐", category: "男子シングルス", rank: 1, points: 68 },
  { name: "Tomoki Kajiyama", category: "男子ダブルス", rank: 1, points: 270 },
  { name: "Hiroki Tanimura", category: "男子シングルス", rank: 2, points: 61 },
  { name: "Yohei Koide", category: "男子シングルス 35+", rank: 1, points: 38 },
];

// ---------------------------------------------------------------------------
// サイトURL
// ---------------------------------------------------------------------------
const SITE_URL = "https://pikura.app";

// ---------------------------------------------------------------------------
// ランダム選択ヘルパー
// ---------------------------------------------------------------------------
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------------------
// プロンプト組み立て
// ---------------------------------------------------------------------------
function buildPrompt() {
  // ランダムに選手と記事を1つずつ選ぶ
  const player = pickRandom(TOP_PLAYERS);
  const article = pickRandom(ARTICLES);
  const articleUrl = `${SITE_URL}/articles/${article.slug}`;

  return `
あなたは日本のピックルボール総合メディア「pikura」(@pikura_app) のSNS担当です。
X (Twitter) に投稿するツイート候補を5つ生成してください。

【制約】
- 各ツイートは日本語で140文字以内（ハッシュタグ込み）
- 必ず末尾に #ピックルボール を付ける
- 絵文字は1〜2個まで自然に使う
- 宣伝臭くなく、読みたくなる自然な口調で

【5つのカテゴリと指示】

1. ランキング紹介（選手スポットライト）
   対象選手: ${player.name}（JPA公式ランキング ${player.category} ${player.rank}位、${player.points}pt）
   → 選手の実績を紹介し、ランキングページへの誘導を含めてください。
   URL: ${SITE_URL}/ranking

2. ルール豆知識
   → 「知ってた？」で始まるフック付きのピックルボールルール豆知識。
   例: キッチンルール、サーブルール、スコアリングなど。

3. 記事紹介
   対象記事: 「${article.title}」
   URL: ${articleUrl}
   → 記事の内容を一言で要約し、URLを含めてください。

4. コミュニティ（エンゲージメント）
   → 質問形式や投票を促すツイート。フォロワーが返信したくなる内容。
   例: 「あなたの得意ショットは？」「週何回プレーしてる？」

5. 大会情報
   → ピックルボール大会・イベントへの参加を促す一般的なツイート。
   特定の大会名は出さず、「大会に出てみませんか？」的な内容。
   参考URL: ${SITE_URL}/articles/first-tournament-guide

【出力フォーマット】
各ツイートを以下の形式で出力してください（余計な説明は不要）:

[ランキング紹介] ツイート本文
[ルール豆知識] ツイート本文
[記事紹介] ツイート本文
[コミュニティ] ツイート本文
[大会情報] ツイート本文
`.trim();
}

// ---------------------------------------------------------------------------
// Gemini API 呼び出し（fetch使用、SDK不要）
// ---------------------------------------------------------------------------
async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

  const body = {
    system_instruction: {
      parts: [
        {
          text: "あなたはピックルボール専門メディアのSNS運用担当です。日本語で、カジュアルだけど信頼感のあるトーンでツイートを作成してください。",
        },
      ],
    },
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 1.0,
      maxOutputTokens: 4096,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API エラー (${res.status}): ${errorText}`);
  }

  const data = await res.json();

  // レスポンスからテキストを抽出
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini API からテキストが返されませんでした");
  }

  return text;
}

// ---------------------------------------------------------------------------
// メイン処理
// ---------------------------------------------------------------------------
async function main() {
  console.log("pikura ツイート候補生成");
  console.log("=".repeat(50));
  console.log("");

  const prompt = buildPrompt();

  console.log("Gemini 2.5 Flash にリクエスト中...");
  console.log("");

  try {
    const result = await callGemini(prompt);

    console.log("-".repeat(50));
    console.log("生成されたツイート候補:");
    console.log("-".repeat(50));
    console.log("");
    console.log(result.trim());
    console.log("");
    console.log("-".repeat(50));
    console.log("");
    console.log("API使用: 1リクエスト（無料枠）");
  } catch (error) {
    console.error(`エラーが発生しました: ${error.message}`);
    process.exit(1);
  }
}

main();
