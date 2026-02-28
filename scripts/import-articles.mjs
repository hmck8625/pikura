/**
 * microCMS 記事一括入稿・更新スクリプト
 *
 * 使い方:
 *   MICROCMS_WRITE_KEY=xxxx node scripts/import-articles.mjs          # 新規作成
 *   MICROCMS_WRITE_KEY=xxxx node scripts/import-articles.mjs --update  # 既存記事を更新
 *   MICROCMS_WRITE_KEY=xxxx node scripts/import-articles.mjs --slug funamizu-pickleball  # 単一記事のみ
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
  console.error("MICROCMS_WRITE_KEY が未設定です");
  console.error("");
  console.error("使い方:");
  console.error("  MICROCMS_WRITE_KEY=xxxxx node scripts/import-articles.mjs");
  console.error("  MICROCMS_WRITE_KEY=xxxxx node scripts/import-articles.mjs --update");
  console.error("  MICROCMS_WRITE_KEY=xxxxx node scripts/import-articles.mjs --slug funamizu-pickleball");
  process.exit(1);
}

const isUpdate = process.argv.includes("--update");
const slugIndex = process.argv.indexOf("--slug");
const targetSlug = slugIndex !== -1 ? process.argv[slugIndex + 1] : null;

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
    category: "players",
    description:
      "ソフトテニス全日本王者からピックルボールに転向。MLP日本人初ドラフト指名の快挙と戦績を徹底解説。",
    file: "013_船水雄太ピックルボール.md",
  },
  {
    slug: "pickleball-japan-tv",
    title: "ピックルボールジャパンTVが日本一おすすめな理由｜船水雄太のYouTubeチャンネル徹底解説【2026年最新】",
    category: "players",
    description:
      "船水雄太選手が運営するYouTubeチャンネル「ピックルボールジャパンTV」を徹底解説。MLP挑戦ドキュメンタリー、試合映像、技術解説、パドルレビューなど、日本語で世界最高峰のピックルボールを学べる唯一無二のチャンネルの魅力と、レベル別おすすめ視聴ガイドを紹介。",
    file: "014_ピックルボールジャパンTV特集.md",
  },
  {
    slug: "app-japan-open-2026-report",
    title: "APP JAPAN SKECHERS Open 2026 現地レポート｜日本初のAPP公式国際大会を体験してきた",
    category: "events",
    description:
      "2026年2月、三重県津市で開催された日本初のAPP公式国際ピックルボール大会「APP JAPAN SKECHERS Open 2026」の現地レポート。12面のコート、DUPR6.5クラスの海外プロ選手のプレー、豪華スポンサー陣など、写真付きで会場の様子をお届けします。",
    file: "015_APP_JAPAN_Open_2026現地レポート.md",
  },
];

/**
 * slugで既存記事のcontentIdを検索（複数ヒット時は最新を返す）
 */
async function findArticleBySlug(slug) {
  const url = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/articles?filters=slug[equals]${slug}&fields=id,slug,createdAt&limit=10&orders=-createdAt`;
  const res = await fetch(url, {
    headers: { "X-MICROCMS-API-KEY": WRITE_KEY },
  });

  if (!res.ok) return null;
  const data = await res.json();
  if (data.contents.length === 0) return null;

  if (data.contents.length > 1) {
    console.warn(`    注意: slug "${slug}" に ${data.contents.length} 件の記事が存在します（最新を更新します）`);
  }

  return data.contents[0].id;
}

/**
 * 記事を作成または更新
 */
async function upsertArticle(article, index, total) {
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

  let method = "POST";
  let url = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/articles`;

  // 常に既存記事を確認して重複作成を防止する
  const existingId = await findArticleBySlug(article.slug);
  if (existingId) {
    method = "PATCH";
    url = `${url}/${existingId}`;
  } else if (isUpdate) {
    console.log(`    slug "${article.slug}" は新規記事です（POSTで作成）`);
  }

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-MICROCMS-API-KEY": WRITE_KEY,
    },
    body: JSON.stringify(body),
  });

  const label = `[${index + 1}/${total}]`;
  if (res.ok) {
    const data = await res.json();
    const action = method === "PATCH" ? "更新" : "作成";
    console.log(`  ${label} ${action}: ${article.title} (id: ${data.id})`);
  } else {
    const text = await res.text();
    console.error(`  ${label} 失敗: ${article.title}`);
    console.error(`   Status: ${res.status} ${res.statusText}`);
    console.error(`   ${text}`);
  }
}

// --- メイン処理 ---

const targets = targetSlug
  ? articles.filter((a) => a.slug === targetSlug)
  : articles;

if (targets.length === 0) {
  console.error(`slug "${targetSlug}" が見つかりません。`);
  console.error("有効なスラッグ:");
  for (const a of articles) {
    console.error(`  - ${a.slug}`);
  }
  process.exit(1);
}

console.log("microCMS 記事入稿");
console.log(`  サービス: ${SERVICE_DOMAIN}`);
console.log(`  モード: ${isUpdate ? "更新（既存記事をPATCH）" : "新規作成（POST）"}`);
console.log(`  記事数: ${targets.length}`);
console.log("");

for (let i = 0; i < targets.length; i++) {
  await upsertArticle(targets[i], i, targets.length);
  if (i < targets.length - 1) {
    await new Promise((r) => setTimeout(r, 1000));
  }
}

console.log("");
console.log("完了: https://pikura.microcms.io");
