import { NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";

// Vercel Cron Jobs からの呼び出しを検証
function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // CRON_SECRET 未設定時はスキップ
  return authHeader === `Bearer ${cronSecret}`;
}

// 記事データ
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

const TOP_PLAYERS = [
  { name: "東村 大祐", category: "男子シングルス", rank: 1, points: 68 },
  { name: "Tomoki Kajiyama", category: "男子ダブルス", rank: 1, points: 270 },
  { name: "Hiroki Tanimura", category: "男子シングルス", rank: 2, points: 61 },
  { name: "Yohei Koide", category: "男子シングルス 35+", rank: 1, points: 38 },
];

const SITE_URL = "https://pikura.app";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Gemini API でツイート1本生成
async function generateTweet(): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY が未設定");

  const article = pickRandom(ARTICLES);
  const player = pickRandom(TOP_PLAYERS);
  const articleUrl = `${SITE_URL}/articles/${article.slug}`;

  const categories = [
    `記事紹介: 「${article.title}」を紹介。URL: ${articleUrl} を含めて`,
    `ルール豆知識: 「知ってた？」で始まるピックルボールルール豆知識`,
    `ランキング紹介: ${player.name}（${player.category} ${player.rank}位、${player.points}pt）。URL: ${SITE_URL}/ranking を含めて`,
    `コミュニティ: 質問形式でフォロワーの返信を促す`,
    `大会情報: 大会参加を促す。参考URL: ${SITE_URL}/articles/first-tournament-guide`,
  ];

  const category = pickRandom(categories);

  const prompt = `
あなたは日本のピックルボール総合メディア「pikura」(@pikura_app) のSNS担当です。
以下の指示に従ってツイートを1本だけ生成してください。

【制約】
- 日本語で140文字以内（ハッシュタグ込み）
- 末尾に #ピックルボール を付ける
- 絵文字は1〜2個
- 宣伝臭くなく自然な口調

【指示】
${category}

【出力】
ツイート本文のみ出力。余計な説明は不要。
`.trim();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: "ピックルボール専門メディアのSNS担当。カジュアルで信頼感のあるトーン。" }],
      },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 1.0, maxOutputTokens: 512 },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini API ${res.status}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error("Gemini: テキストなし");

  return text;
}

// X API でツイート投稿
async function postTweet(text: string): Promise<{ id: string; url: string }> {
  const client = new TwitterApi({
    appKey: process.env.X_CONSUMER_KEY!,
    appSecret: process.env.X_CONSUMER_SECRET!,
    accessToken: process.env.X_ACCESS_TOKEN!,
    accessSecret: process.env.X_ACCESS_TOKEN_SECRET!,
  });

  const result = await client.v2.tweet(text);
  const tweetId = result.data.id;

  return {
    id: tweetId,
    url: `https://x.com/i/web/status/${tweetId}`,
  };
}

export async function GET(request: Request) {
  // Cron認証チェック
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 環境変数チェック
  const required = ["GEMINI_API_KEY", "X_CONSUMER_KEY", "X_CONSUMER_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `環境変数未設定: ${missing.join(", ")}` },
      { status: 500 }
    );
  }

  try {
    // ツイート生成
    const tweetText = await generateTweet();

    // 投稿
    const result = await postTweet(tweetText);

    return NextResponse.json({
      success: true,
      tweet: {
        id: result.id,
        url: result.url,
        text: tweetText,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Cron tweet error: ${message}`);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
