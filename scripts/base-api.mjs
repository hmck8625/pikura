#!/usr/bin/env node

/**
 * BASE API 商品一括登録スクリプト
 *
 * OAuth2認証 → 商品登録 → 画像アップロードを一括で実行する。
 *
 * 事前準備:
 *   1. https://developers.thebase.in/ でアプリ登録
 *   2. .env.local に以下を設定:
 *      BASE_CLIENT_ID=xxx
 *      BASE_CLIENT_SECRET=xxx
 *   3. redirect_uri を http://localhost:3456/callback に設定
 *
 * 使い方:
 *   node scripts/base-api.mjs auth          # OAuth2認証（初回 or トークン期限切れ時）
 *   node scripts/base-api.mjs register      # 全商品を一括登録
 *   node scripts/base-api.mjs register --slug stay-out-of-the-kitchen  # 特定商品のみ
 *   node scripts/base-api.mjs upload-images  # 全商品画像をアップロード
 *   node scripts/base-api.mjs status        # トークン・商品登録状態を確認
 *
 * scope: read_items write_items
 */

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");

// --- 設定 ---

const BASE_API = "https://api.thebase.in/1";
const AUTH_URL = "https://api.thebase.in/1/oauth/authorize";
const TOKEN_URL = "https://api.thebase.in/1/oauth/token";
const REDIRECT_URI = "http://localhost:3456/callback"; // BASEアプリ登録時のredirect_uriと一致させる
const SCOPES = "read_items write_items";
const TOKEN_FILE = join(PROJECT_ROOT, ".base-tokens.json");
const IMAGE_DIR = join(PROJECT_ROOT, "public", "images", "shop");

// .env.local読み込み
async function loadEnv() {
  const envPath = join(PROJECT_ROOT, ".env.local");
  if (!existsSync(envPath)) {
    console.error(".env.local が見つかりません");
    process.exit(1);
  }
  const content = await readFile(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  }
}

await loadEnv();

const CLIENT_ID = process.env.BASE_CLIENT_ID;
const CLIENT_SECRET = process.env.BASE_CLIENT_SECRET;

// --- 商品データ ---

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

// --- トークン管理 ---

async function loadTokens() {
  if (!existsSync(TOKEN_FILE)) return null;
  const data = JSON.parse(await readFile(TOKEN_FILE, "utf-8"));
  return data;
}

async function saveTokens(tokens) {
  await writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2), "utf-8");
  console.log(`トークン保存: ${TOKEN_FILE}`);
}

async function getAccessToken() {
  const tokens = await loadTokens();
  if (!tokens) {
    console.error("トークンが未取得です。先に `node scripts/base-api.mjs auth` を実行してください。");
    process.exit(1);
  }

  // トークンの有効期限チェック（1時間）
  const expiresAt = tokens.obtained_at + tokens.expires_in * 1000;
  if (Date.now() > expiresAt - 60000) {
    console.log("アクセストークンの期限切れ。リフレッシュ中...");
    return await refreshToken(tokens.refresh_token);
  }

  return tokens.access_token;
}

async function refreshToken(refreshToken) {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: refreshToken,
  });

  const res = await fetch(`${TOKEN_URL}?${params}`, { method: "POST" });
  const data = await res.json();

  if (data.error) {
    console.error(`リフレッシュ失敗: ${data.error_description || data.error}`);
    console.error("再認証が必要です: node scripts/base-api.mjs auth");
    process.exit(1);
  }

  const tokens = { ...data, obtained_at: Date.now() };
  await saveTokens(tokens);
  console.log("トークンをリフレッシュしました。");
  return tokens.access_token;
}

// --- ユーティリティ ---

function prompt(message) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// --- OAuth2認証フロー ---

async function authenticate() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error("BASE_CLIENT_ID と BASE_CLIENT_SECRET を .env.local に設定してください。");
    console.error("");
    console.error("手順:");
    console.error("  1. https://developers.thebase.in/ でアプリ登録");
    console.error("  2. redirect_uri: http://localhost:3456/callback");
    console.error("  3. scope: read_items write_items");
    console.error("  4. .env.local に CLIENT_ID と CLIENT_SECRET を追加");
    process.exit(1);
  }

  const authUrl = `${AUTH_URL}?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;

  console.log("=".repeat(60));
  console.log("BASE OAuth2 認証");
  console.log("=".repeat(60));
  console.log("");
  console.log("Step 1: 以下のURLをブラウザで開いてください:");
  console.log("");
  console.log(authUrl);
  console.log("");
  console.log("Step 2: BASEにログインして「許可」をクリック");
  console.log("");
  console.log("Step 3: リダイレクト先のURLをコピーしてください");
  console.log('  （ブラウザのアドレスバーに "localhost:3456/callback?code=..." と表示されるURL）');
  console.log("");

  const input = await prompt("リダイレクト先のURL（またはcodeの値）を貼り付けてください: ");

  // URLからcodeを抽出、またはcode値そのものを受け付ける
  let code;
  if (input.includes("code=")) {
    const url = new URL(input.startsWith("http") ? input : `http://dummy?${input}`);
    code = url.searchParams.get("code");
  } else {
    code = input;
  }

  if (!code) {
    console.error("認証コードが取得できませんでした。");
    process.exit(1);
  }

  console.log(`\n認証コード取得: ${code.substring(0, 10)}...`);
  console.log("アクセストークンを取得中...");

  // コードをトークンに交換
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code: code,
    redirect_uri: REDIRECT_URI,
  });

  const res = await fetch(`${TOKEN_URL}?${params}`, { method: "POST" });
  const data = await res.json();

  if (data.error) {
    console.error(`トークン取得失敗: ${data.error_description || data.error}`);
    process.exit(1);
  }

  const tokens = { ...data, obtained_at: Date.now() };
  await saveTokens(tokens);

  console.log("");
  console.log("認証完了!");
  console.log(`  access_token: ${tokens.access_token.substring(0, 20)}...`);
  console.log(`  expires_in: ${tokens.expires_in}秒`);
  console.log(`  scope: ${tokens.scope}`);
  console.log("");
  console.log("これで商品登録が可能です:");
  console.log("  node scripts/base-api.mjs register");
}

// --- 商品登録 ---

async function registerProducts(targetSlug) {
  const accessToken = await getAccessToken();
  const products = targetSlug
    ? PRODUCTS.filter((p) => p.slug === targetSlug)
    : PRODUCTS;

  if (products.length === 0) {
    console.error(`商品が見つかりません: ${targetSlug}`);
    process.exit(1);
  }

  console.log("=".repeat(60));
  console.log("BASE 商品一括登録");
  console.log("=".repeat(60));
  console.log(`  対象: ${products.length}件`);
  console.log("");

  let success = 0;
  let fail = 0;
  const results = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    console.log(`[${i + 1}/${products.length}] ${p.name}`);

    try {
      const formData = new URLSearchParams({
        title: p.name,
        detail: p.desc,
        price: String(p.price),
        stock: "999",
        visible: "1",
        identifier: p.slug,
        list_order: String(i + 1),
      });

      const res = await fetch(`${BASE_API}/items/add`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error_description || data.error);
      }

      const itemId = data.item?.item_id;
      console.log(`  登録成功: item_id=${itemId}`);
      results.push({ slug: p.slug, itemId, status: "ok" });
      success++;
    } catch (error) {
      console.error(`  登録失敗: ${error.message}`);
      results.push({ slug: p.slug, itemId: null, status: "failed", error: error.message });
      fail++;
    }

    // レート制限対策
    if (i < products.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // 結果をJSONに保存（画像アップロード時に使う）
  const mappingFile = join(__dirname, "base-item-mapping.json");
  await writeFile(mappingFile, JSON.stringify(results, null, 2), "utf-8");

  console.log(`\n${"=".repeat(60)}`);
  console.log(`完了: ${success}件成功, ${fail}件失敗`);
  console.log(`マッピングファイル: ${mappingFile}`);
  console.log("=".repeat(60));

  if (fail > 0) process.exit(1);
}

// --- 画像アップロード ---

const SITE_URL = "https://pikura.app";

async function uploadImages(targetSlug) {
  const accessToken = await getAccessToken();
  const mappingFile = join(__dirname, "base-item-mapping.json");

  if (!existsSync(mappingFile)) {
    console.error("base-item-mapping.json がありません。先に register を実行してください。");
    process.exit(1);
  }

  const mapping = JSON.parse(await readFile(mappingFile, "utf-8"));
  const items = targetSlug
    ? mapping.filter((m) => m.slug === targetSlug && m.status === "ok")
    : mapping.filter((m) => m.status === "ok");

  if (items.length === 0) {
    console.error("アップロード対象の商品がありません。");
    process.exit(1);
  }

  console.log("=".repeat(60));
  console.log("BASE 商品画像アップロード（image_url方式）");
  console.log("=".repeat(60));
  console.log(`  対象: ${items.length}件`);
  console.log(`  画像ソース: ${SITE_URL}/images/shop/`);
  console.log("");
  console.log("注意: 画像がpikura.appにデプロイ済みである必要があります。");
  console.log("");

  let success = 0;
  let fail = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const imageUrl = `${SITE_URL}/images/shop/${item.slug}.png`;
    console.log(`[${i + 1}/${items.length}] ${item.slug}`);

    try {
      const formData = new URLSearchParams({
        item_id: String(item.itemId),
        image_no: "1",
        image_url: imageUrl,
      });

      const res = await fetch(`${BASE_API}/items/add_image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error_description || data.error);
      }

      const imgUrl = data.item?.img1_origin;
      console.log(`  アップロード成功${imgUrl ? "" : ""}`);
      success++;
    } catch (error) {
      console.error(`  失敗: ${error.message}`);
      fail++;
    }

    // レート制限対策
    if (i < items.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`完了: ${success}件成功, ${fail}件失敗`);
  console.log("=".repeat(60));

  if (fail > 0) process.exit(1);
}

// --- ステータス確認 ---

async function showStatus() {
  console.log("=".repeat(60));
  console.log("BASE API ステータス");
  console.log("=".repeat(60));

  // トークン状態
  const tokens = await loadTokens();
  if (tokens) {
    const expiresAt = new Date(tokens.obtained_at + tokens.expires_in * 1000);
    const isExpired = Date.now() > expiresAt.getTime();
    console.log(`\nトークン:`);
    console.log(`  取得日時: ${new Date(tokens.obtained_at).toLocaleString("ja-JP")}`);
    console.log(`  有効期限: ${expiresAt.toLocaleString("ja-JP")} ${isExpired ? "(期限切れ)" : "(有効)"}`);
    console.log(`  scope: ${tokens.scope || "不明"}`);
  } else {
    console.log("\nトークン: 未取得");
    console.log("  → node scripts/base-api.mjs auth で認証してください");
  }

  // CLIENT_ID/SECRET状態
  console.log(`\n認証情報:`);
  console.log(`  CLIENT_ID: ${CLIENT_ID ? CLIENT_ID.substring(0, 10) + "..." : "未設定"}`);
  console.log(`  CLIENT_SECRET: ${CLIENT_SECRET ? "設定済み" : "未設定"}`);

  // マッピングファイル
  const mappingFile = join(__dirname, "base-item-mapping.json");
  if (existsSync(mappingFile)) {
    const mapping = JSON.parse(await readFile(mappingFile, "utf-8"));
    const ok = mapping.filter((m) => m.status === "ok").length;
    const failed = mapping.filter((m) => m.status === "failed").length;
    console.log(`\n商品登録状態:`);
    console.log(`  成功: ${ok}件`);
    console.log(`  失敗: ${failed}件`);
  } else {
    console.log(`\n商品登録状態: 未実行`);
  }

  // 画像ファイル
  const imageCount = PRODUCTS.filter((p) =>
    existsSync(join(IMAGE_DIR, `${p.slug}.png`)),
  ).length;
  console.log(`\n画像ファイル: ${imageCount}/${PRODUCTS.length}枚`);
}

// --- メイン ---

const command = process.argv[2];
const slugFlag = process.argv.indexOf("--slug");
const targetSlug = slugFlag !== -1 ? process.argv[slugFlag + 1] : null;

switch (command) {
  case "auth":
    await authenticate();
    break;
  case "register":
    await registerProducts(targetSlug);
    break;
  case "upload-images":
    await uploadImages(targetSlug);
    break;
  case "status":
    await showStatus();
    break;
  default:
    console.log("BASE API 商品管理ツール");
    console.log("");
    console.log("コマンド:");
    console.log("  auth           OAuth2認証（初回 or トークン期限切れ時）");
    console.log("  register       全商品を一括登録");
    console.log("  upload-images  全商品画像をアップロード");
    console.log("  status         トークン・商品登録状態を確認");
    console.log("");
    console.log("オプション:");
    console.log("  --slug <slug>  特定の商品のみを対象にする");
    console.log("");
    console.log("事前準備:");
    console.log("  1. https://developers.thebase.in/ でアプリ登録");
    console.log("  2. redirect_uri: http://localhost:3456/callback");
    console.log("  3. .env.local に BASE_CLIENT_ID, BASE_CLIENT_SECRET を設定");
    break;
}
