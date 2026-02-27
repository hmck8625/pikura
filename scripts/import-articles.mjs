/**
 * microCMS 記事一括入稿スクリプト
 *
 * 使い方:
 *   1. microCMS管理画面 → API設定 → APIキー → 「POST/PUT/PATCH/DELETE」用キーをコピー
 *   2. 以下を実行:
 *      MICROCMS_WRITE_KEY=xxxx node scripts/import-articles.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { marked } from "marked";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = resolve(__dirname, "../../articles");

const SERVICE_DOMAIN = "pikura";
const WRITE_KEY = process.env.MICROCMS_WRITE_KEY;

if (!WRITE_KEY) {
  console.error("❌ MICROCMS_WRITE_KEY が未設定です");
  console.error("");
  console.error("使い方:");
  console.error("  MICROCMS_WRITE_KEY=xxxxx node scripts/import-articles.mjs");
  console.error("");
  console.error("キーの取得方法:");
  console.error("  microCMS管理画面 → 左メニュー「APIキー」→「POST/PUT/PATCH/DELETE」のキーをコピー");
  process.exit(1);
}

// 記事データ（slug, title, category, description, ファイルパス）
const articles = [
  {
    slug: "what-is-pickleball",
    title: "ピックルボールとは？初心者向け完全ガイド【2026年最新】",
    category: "beginner",
    description:
      "ピックルボールの基本ルール・魅力・歴史から日本の最新動向まで。これを読めば全体像がわかります。",
    file: "001_ピックルボールとは.md",
  },
  {
    slug: "how-to-start-pickleball",
    title: "ピックルボールの始め方｜初心者が揃えるべき道具・費用・練習場所",
    category: "beginner",
    description:
      "パドル・ボール・シューズの選び方から練習場所の探し方まで、ゼロから始める5ステップを解説。",
    file: "002_ピックルボールの始め方.md",
  },
  {
    slug: "pickleball-rules",
    title: "ピックルボールのルール完全解説｜サーブ・得点・キッチン",
    category: "rules",
    description:
      "サーブルール、スコアリング、キッチン（ノンボレーゾーン）など、2026年最新ルールを徹底解説。",
    file: "003_ピックルボールのルール.md",
  },
  {
    slug: "paddle-guide",
    title: "ピックルボールのパドルおすすめ10選｜初心者〜上級者の選び方",
    category: "gear",
    description:
      "JOOLA、Selkirk、Franklinなど人気パドル10モデルを徹底比較。素材・重さ・価格別の選び方ガイド。",
    file: "004_パドルの選び方.md",
  },
  {
    slug: "tokyo-pickleball-courts",
    title: "東京でピックルボールができる場所まとめ｜専用コート・体験会",
    category: "beginner",
    description:
      "池袋・渋谷・お台場など東京都内のピックルボール施設6選。料金・アクセス・予約方法付き。",
    file: "005_東京でできる場所.md",
  },
  {
    slug: "doubles-tactics",
    title: "ピックルボール ダブルス戦術ガイド｜勝てるペアになるための基本と応用",
    category: "tips",
    description:
      "3rdショットドロップ、ディンク戦、スタッキング、ポーチなど、ダブルスで勝つための戦術を網羅。",
    file: "006_ダブルス戦術ガイド.md",
  },
  {
    slug: "court-size-setup",
    title: "ピックルボール コートのサイズ・寸法と設営方法",
    category: "rules",
    description:
      "コート寸法、テニス/バドミントンコートとの比較、自宅・体育館での設営方法と費用を解説。",
    file: "007_コートサイズと設営.md",
  },
  {
    slug: "shoes-guide",
    title: "ピックルボール シューズおすすめ8選｜インドア・アウトドア別",
    category: "gear",
    description:
      "ミズノ、アシックス、ヨネックスなどインドア・アウトドア別おすすめ8足を価格・特徴付きで紹介。",
    file: "008_シューズの選び方.md",
  },
  {
    slug: "first-tournament-guide",
    title: "初めてのピックルボール大会参加ガイド｜エントリーから当日まで",
    category: "events",
    description:
      "JPA大会の種類、エントリー方法、持ち物、当日の流れ。初心者が出やすい大会情報付き。",
    file: "009_初めての大会参加ガイド.md",
  },
  {
    slug: "jpa-ranking-explained",
    title: "JPA公式ランキングの仕組み｜ポイント計算・カテゴリ・載り方",
    category: "events",
    description:
      "2026年1月に開始されたJPA公式ランキング制度を徹底解説。ポイント計算、カテゴリ分類、DUPRとの違い。",
    file: "010_JPAランキングの仕組み.md",
  },
  {
    slug: "youtube-channels",
    title: "ピックルボール おすすめYouTubeチャンネル12選｜日本語＆英語",
    category: "beginner",
    description:
      "船水雄太、青春ピックルちゃんねる、Selkirk TVなど日本語・英語の厳選チャンネルを紹介。動画で効率的に上達。",
    file: "011_ピックルボールYouTubeチャンネル.md",
  },
  {
    slug: "paddle-shop-guide",
    title: "ピックルボール パドルが買えるお店まとめ｜専門ショップ＆大手通販",
    category: "gear",
    description:
      "SANNO SPORTS、Pickle-One、ウインザーなど国内のパドル購入先を網羅。試打可否・価格帯・特徴を比較。",
    file: "012_パドルショップガイド.md",
  },
  {
    slug: "funamizu-pickleball",
    title: "船水雄太のピックルボール挑戦｜ソフトテニス界のスターからMLP指名へ",
    category: "tips",
    description:
      "ソフトテニス全日本王者からピックルボールに転向。MLP日本人初ドラフト指名の快挙と戦績を徹底解説。",
    file: "013_船水雄太ピックルボール.md",
  },
];

async function createArticle(article, index) {
  // Markdownファイルを読み込み → HTML変換
  const mdPath = resolve(ARTICLES_DIR, article.file);
  const markdown = readFileSync(mdPath, "utf-8");
  const html = await marked(markdown);

  const body = {
    title: article.title,
    slug: article.slug,
    category: [article.category],
    description: article.description,
    content: html,
  };

  const res = await fetch(
    `https://${SERVICE_DOMAIN}.microcms.io/api/v1/articles`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-MICROCMS-API-KEY": WRITE_KEY,
      },
      body: JSON.stringify(body),
    }
  );

  if (res.ok) {
    const data = await res.json();
    console.log(`✅ [${index + 1}/${articles.length}] ${article.title} (id: ${data.id})`);
  } else {
    const text = await res.text();
    console.error(`❌ [${index + 1}/${articles.length}] ${article.title}`);
    console.error(`   Status: ${res.status} ${res.statusText}`);
    console.error(`   ${text}`);
  }
}

console.log("📝 microCMS 記事一括入稿を開始します...");
console.log(`   サービス: ${SERVICE_DOMAIN}`);
console.log(`   記事数: ${articles.length}`);
console.log("");

for (let i = 0; i < articles.length; i++) {
  await createArticle(articles[i], i);
  // レート制限回避のため少し待つ
  if (i < articles.length - 1) {
    await new Promise((r) => setTimeout(r, 1000));
  }
}

console.log("");
console.log("🎉 完了！microCMS管理画面で確認してください。");
console.log("   https://pikura.microcms.io");
