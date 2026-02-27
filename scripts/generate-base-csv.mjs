#!/usr/bin/env node

/**
 * BASE商品一括登録用CSV生成スクリプト
 *
 * lib/shop/data.ts の商品データから BASE の商品CSV（一括登録用）を生成する。
 *
 * 使い方:
 *   node scripts/generate-base-csv.mjs
 *   → scripts/base-products.csv が生成される
 *
 * BASE CSV仕様:
 *   https://help.thebase.in/hc/ja/articles/206417521
 *
 * 生成されたCSVをBASE管理画面 > 商品管理 > CSV一括登録 からアップロードする。
 */

import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- 商品データ（data.tsと同期） ---

const PRODUCTS = [
  { slug: "stay-out-of-the-kitchen", name: "STAY OUT OF THE KITCHEN!", price: 4000, desc: "ボレーに夢中でキッチンに入っちゃう、あの瞬間。警告標識風のスポーティなデザインで「入るな！」を主張。ポリエステル100% 吸水速乾ドライ素材。" },
  { slug: "my-partners-fault", name: "IT'S MY PARTNER'S FAULT.", price: 4000, desc: "自分のミスは棚に上げ、パートナーがミスすると無言で圧をかける…ダブルスあるあるの極み。ポリエステル100% 吸水速乾ドライ素材。" },
  { slug: "ball-on", name: "LET! BALL ON!", price: 4000, desc: "白熱したラリー中に隣コートからボールが転がり込んでくる、あの独特の空気感。ポリエステル100% 吸水速乾ドライ素材。" },
  { slug: "dont-interrupt-my-dink", name: "Don't interrupt my dink.", price: 4000, desc: "ディンク練習中に隣コートのボールと空中衝突。真剣な練習を邪魔しないで。ポリエステル100% 吸水速乾ドライ素材。" },
  { slug: "zero-zero-start", name: "0-0-START", price: 4000, desc: "ピックルボールのスコアコールの始まり。この3つの数字を聞くとアドレナリンが出る。ポリエステル100% 吸水速乾ドライ素材。" },
  { slug: "third-shot-drop-expert", name: "Third Shot Drop Expert*", price: 4000, desc: "「*自称」の小さな注釈付き。3rdショットドロップが得意だと思い込んでいるあなたへ。ポリエステル100% 吸水速乾ドライ素材。" },
  { slug: "kitchen-police", name: "KITCHEN POLICE", price: 4000, desc: "キッチン違反を見逃さない正義の味方。コート上のルール番人を自認するあなたに。ポリエステル100% 吸水速乾ドライ素材。" },
  { slug: "dink-responsibly", name: "DINK RESPONSIBLY", price: 4000, desc: "「責任あるディンクを」— ビールの警告文風のウィットに富んだデザイン。ポリエステル100% 吸水速乾ドライ素材。" },
  { slug: "came-for-exercise", name: "I came for the exercise, stayed for the drama", price: 4000, desc: "運動のつもりで始めたのに、気づいたらコート上のドラマに夢中。ピックルボールの社交性を表現。ポリエステル100% 吸水速乾ドライ素材。" },
  { slug: "dupr-doesnt-define-me", name: "My DUPR doesn't define me", price: 4000, desc: "レーティングに一喜一憂する日々。でも大事なのは楽しむこと…たぶん。ポリエステル100% 吸水速乾ドライ素材。" },
  { slug: "dink-or-die", name: "DINK OR DIE", price: 4000, desc: "ディンクするか、死ぬか。ネット際の攻防を制するプレイヤーのための一着。ポリエステル100% 吸水速乾ドライ素材。" },
  { slug: "kitchen-certified", name: "KITCHEN CERTIFIED", price: 4000, desc: "キッチンを制する者がゲームを制す。認定バッジ風の誇り高いデザイン。ポリエステル100% 吸水速乾ドライ素材。" },
  { slug: "net-game-no-mercy", name: "NET GAME. NO MERCY.", price: 4000, desc: "ネット際の攻防に容赦なし。アグレッシブなプレースタイルを宣言するデザイン。ポリエステル100% 吸水速乾ドライ素材。" },
  { slug: "eat-sleep-dink-repeat", name: "EAT. SLEEP. DINK. REPEAT.", price: 4000, desc: "食べて、寝て、ディンクして、繰り返す。ピックルボール漬けのライフスタイル。ポリエステル100% 吸水速乾ドライ素材。" },
  { slug: "drop-it-like-its-hot", name: "DROP IT LIKE IT'S HOT", price: 4000, desc: "Snoop Doggの名曲をピックルボール流に。サードショットドロップを決める瞬間。ポリエステル100% 吸水速乾ドライ素材。" },
  { slug: "kitchen-haittemasen", name: "キッチン入ってないです", price: 4000, desc: "明らかに入ってるのにしらばっくれる名言。日本のピックルボールコートで最も聞く言い訳。ポリエステル100% 吸水速乾ドライ素材。" },
  { slug: "dink-shugyochu", name: "ディンク修行中", price: 4000, desc: "まだまだ未熟だけど、日々精進。ディンクの道は長い。修行僧のように黙々と。ポリエステル100% 吸水速乾ドライ素材。" },
  { slug: "partner-boshuchu", name: "パートナー募集中", price: 4000, desc: "大会に出たいけどペアがいない。このTシャツを着てコートに行けば話しかけてもらえるかも。ポリエステル100% 吸水速乾ドライ素材。" },
  { slug: "pickler-desu", name: "ピクラーです。", price: 4000, desc: "シンプルに宣言。「ピクラー」= ピックルボーラーの日本語愛称。ポリエステル100% 吸水速乾ドライ素材。" },
  { slug: "kyo-mo-pickle", name: "今日もピクる。", price: 4000, desc: "「ピクる」= ピックルボールをする、の造語動詞。毎日ピクりたい人のための一着。ポリエステル100% 吸水速乾ドライ素材。" },
  { slug: "minimal-paddle", name: "ミニマルパドル", price: 4000, desc: "パドルのシルエットだけで伝わる、ピックルボーラーの証。洗練されたミニマルアート。ポリエステル100% 吸水速乾ドライ素材。" },
  { slug: "court-blueprint", name: "コートブループリント", price: 4000, desc: "ピックルボールコートの設計図。建築図面風のインテリジェントなデザイン。ポリエステル100% 吸水速乾ドライ素材。" },
  { slug: "japanese-wave-pickle", name: "浮世絵ピックルボール", price: 4000, desc: "葛飾北斎の大波にピックルボールが乗る。和風×ピックルボールのアートフュージョン。ポリエステル100% 吸水速乾ドライ素材。" },
  { slug: "neon-pickle", name: "ネオンピックル", price: 4000, desc: "夜のネオンサイン風。バーの看板のようなレトロフューチャーなピックルボールデザイン。ポリエステル100% 吸水速乾ドライ素材。" },
  { slug: "pikura-original", name: "PIKURA ORIGINAL", price: 4000, desc: "pikura.appオリジナルブランドTシャツ。シンプルなロゴデザインでピックルボール愛を表現。ポリエステル100% 吸水速乾ドライ素材。" },
];

// --- BASE CSV生成 ---

/**
 * BASEの商品CSVフォーマット:
 * 商品名,説明,価格,税率,在庫数,公開状態,表示順,商品画像1
 *
 * 注意: BASEのCSVフォーマットは変更される可能性があるため、
 * 最新の仕様は https://help.thebase.in/ で確認すること。
 */

function escapeCSV(value) {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function generateCSV() {
  const header = [
    "商品名",
    "説明",
    "価格",
    "税率",
    "在庫数",
    "公開状態",
    "表示順",
  ];

  const rows = PRODUCTS.map((p, index) => [
    escapeCSV(p.name),
    escapeCSV(p.desc),
    p.price,
    10, // 税率10%
    999, // 受注生産なので在庫は多めに
    1, // 公開
    index + 1,
  ]);

  const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
  return csv;
}

// --- メイン ---

const csv = generateCSV();
const outputPath = join(__dirname, "base-products.csv");
await writeFile(outputPath, csv, "utf-8");

console.log(`BASE商品CSV生成完了: ${outputPath}`);
console.log(`  商品数: ${PRODUCTS.length}件`);
console.log(`  価格: 全品 ¥4,000`);
console.log();
console.log("使い方:");
console.log("  1. BASE管理画面にログイン");
console.log("  2. 商品管理 > CSV一括登録");
console.log("  3. このCSVファイルをアップロード");
console.log("  4. 商品画像は別途、管理画面から手動で設定");
console.log();
console.log("注意: 商品画像はCSVでは登録できないため、管理画面から手動で設定してください。");
