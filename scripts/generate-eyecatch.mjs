#!/usr/bin/env node

/**
 * アイキャッチ画像生成スクリプト
 *
 * Gemini 2.5 Flash Image モデルを使って、記事のアイキャッチ（サムネイル/ヒーロー）画像を生成する。
 * コスト意識を持ち、1枚ずつ確認しながら生成する。
 *
 * 使い方:
 *   GEMINI_API_KEY=xxx node scripts/generate-eyecatch.mjs paddle-guide
 *   GEMINI_API_KEY=xxx node scripts/generate-eyecatch.mjs --all
 */

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

// --- 定数 ---

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");
const OUTPUT_DIR = join(PROJECT_ROOT, "public", "images", "articles");

const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`;

/** 生成間隔（ミリ秒）— --all 使用時に連続リクエストを避ける */
const DELAY_BETWEEN_GENERATIONS_MS = 3000;

/** プロンプト共通の末尾指示 */
const PROMPT_SUFFIX =
  "No text or watermarks in the image. High quality, professional. 16:9 aspect ratio.";

// --- 記事スラッグ → プロンプトのマッピング ---

const ARTICLE_PROMPTS = {
  "what-is-pickleball":
    "A bright, clean illustration of a pickleball court with players, paddles, and a yellow pickleball. Modern flat design style. Blue sky background. Brand colors: sky blue #0EA5E9, emerald green #10B981, amber #F59E0B.",

  "how-to-start-pickleball":
    "Beginner-friendly illustration showing pickleball equipment (paddle, ball, shoes) neatly arranged. Clean, inviting style. Bright colors.",

  "pickleball-rules":
    "Infographic-style illustration of a pickleball court with rule annotations (kitchen zone highlighted, serve area). Clean diagram style.",

  "paddle-guide":
    "Array of different pickleball paddles displayed in a product showcase style. Clean white background. Modern photography feel.",

  "tokyo-pickleball-courts":
    "Illustration of Tokyo skyline with a pickleball court in foreground. Cherry blossoms. Japanese-style illustration.",

  "doubles-tactics":
    "Top-down view of a pickleball doubles court with player positions and movement arrows. Strategy diagram style.",

  "court-size-setup":
    "Technical illustration showing pickleball court dimensions with measurements. Blueprint/diagram style. Clean lines.",

  "shoes-guide":
    "Collection of athletic shoes arranged in a visually appealing layout. Clean product photography style.",

  "first-tournament-guide":
    "Exciting illustration of a pickleball tournament scene with players, trophy, and crowd. Energetic, colorful.",

  "jpa-ranking-explained":
    "Modern data visualization illustration showing ranking leaderboard. Numbers, charts, podium. Clean digital style.",

  "youtube-channels":
    "Illustration of a tablet or phone screen showing video thumbnails of pickleball matches. Play buttons, subscribe icons. Modern, colorful. Clean digital design.",

  "paddle-shop-guide":
    "Illustration of a pickleball pro shop interior with paddles displayed on wall racks. Warm lighting, organized shelves. Inviting retail atmosphere.",

  "funamizu-pickleball":
    "Dynamic illustration of a professional pickleball player in action, hitting a powerful shot on a tournament court. Energetic pose, stadium background. Japanese sports illustration style.",

  "pickleball-japan-tv":
    "Illustration of a TV screen showing a pickleball match broadcast. Japanese TV studio atmosphere with commentators. Modern media style.",

  "app-japan-open-2026-report":
    "Vibrant tournament report illustration of a large-scale pickleball event in Japan. Indoor arena, crowds cheering, professional players on court. Event banner and Japanese flags.",

  "osaka-pickleball":
    "Illustration of Osaka cityscape with Osaka Castle and a pickleball court in foreground. Vibrant Osaka street culture feel. Japanese illustration style.",

  "nagoya-pickleball-courts":
    "Illustration of Nagoya skyline with Nagoya Castle and pickleball courts. Clean, modern Japanese city sports scene.",

  "pickleball-serve-guide":
    "Dynamic illustration of a player performing an underhand serve on a pickleball court. Motion lines showing ball trajectory. Tutorial/instructional style.",

  "pickleball-vs-tennis":
    "Split-screen comparison illustration: tennis court on left, pickleball court on right. Equipment side by side. Clean infographic style.",

  "dupr-japan-guide":
    "Modern data dashboard illustration showing DUPR rating system. Digital screens with player ratings, graphs, and statistics. Tech-forward style.",

  "kanagawa-pickleball-courts":
    "Illustration of Kanagawa coastline (Yokohama, Shonan beach) with pickleball courts. Ocean breeze, blue sky. Japanese coastal scene.",

  "dink-guide":
    "Close-up illustration of a pickleball player executing a soft dink shot at the kitchen line. Precise, controlled motion. Tutorial style.",

  "doubles-rules":
    "Illustration of four players on a pickleball doubles court with rule annotations. Serving order arrows, court zones labeled. Clean diagram style.",

  "court-reservation-guide":
    "Illustration of a smartphone screen showing a court reservation app interface. Calendar, time slots, location pins. Modern UI design style.",

  "practice-drills":
    "Illustration of pickleball players doing various practice drills on court. Cones, targets, footwork patterns. Energetic training session atmosphere.",

  "scoring-guide":
    "Infographic illustration of pickleball scoring system. Scoreboard, numbers 0-11, side-out concept visualized. Clean educational style.",

  "third-shot-drop":
    "Illustration showing the trajectory of a third-shot drop in pickleball. Arc from baseline to kitchen. Tactical diagram with player positions.",

  "pickleball-wear-guide":
    "Flat-lay illustration of pickleball athletic wear: moisture-wicking shirts, shorts, skirts, caps, wristbands. Clean product layout style.",

  "wall-practice-guide":
    "Illustration of a player practicing pickleball against a wall. Solo training scene. Simple, motivational. Indoor or outdoor setting.",

  "ball-guide":
    "Collection of different pickleball balls (indoor and outdoor) arranged in a product showcase. Close-up details of hole patterns. Clean photography style.",

  "fukuoka-pickleball-courts":
    "Illustration of Fukuoka cityscape with Canal City and a pickleball court. Warm Kyushu atmosphere. Japanese regional illustration.",

  "saitama-chiba-pickleball":
    "Illustration of suburban Tokyo (Saitama and Chiba) with community pickleball courts. Parks, residential areas, friendly atmosphere.",

  "mlp-pickleball-guide":
    "Exciting illustration of Major League Pickleball scene. Professional arena, team logos, American sports entertainment atmosphere. High energy.",

  "injury-prevention":
    "Health and wellness illustration showing stretching exercises and protective gear for pickleball. Anatomy highlights on joints. Medical/sports science style.",

  "certification-guide":
    "Illustration of a pickleball certification ceremony. Certificate, badge, referee whistle, rulebook. Professional achievement style.",

  "return-guide":
    "Dynamic illustration of a player returning a serve in pickleball. Athletic stance, paddle contact with ball. Action sports photography style.",

  "volley-guide":
    "Illustration of a player at the net executing a volley shot. Quick reflexes, net-play action. Dynamic sports illustration.",

  "lob-guide":
    "Illustration showing the high arc trajectory of a lob shot in pickleball. Player hitting upward, ball arcing over opponent. Tactical diagram style.",

  "singles-tactics":
    "Top-down view of a pickleball singles court with player movement patterns and strategy arrows. Tactical analysis style.",

  "positioning-guide":
    "Bird's-eye view illustration of a pickleball court showing optimal player positions. Heat map style zones. Clean tactical diagram.",

  "grip-guide":
    "Close-up illustration of hands holding a pickleball paddle showing different grip techniques (continental, eastern). Tutorial detail style.",

  "hokkaido-pickleball":
    "Illustration of Hokkaido landscape with snow-capped mountains and an indoor pickleball facility. Winter sports atmosphere. Japanese northern scenery.",

  "kyoto-pickleball":
    "Illustration of Kyoto with traditional temples and a pickleball court. Cherry blossoms, torii gate. Japanese cultural fusion style.",

  "sendai-tohoku-pickleball":
    "Illustration of Sendai city with Zuihoden and pickleball courts. Tanabata festival decorations. Tohoku regional character.",

  "pickleball-vs-badminton":
    "Split-screen comparison: badminton court on left, pickleball court on right. Shuttlecock vs pickleball. Clean infographic style.",

  "pickleball-history":
    "Vintage-style illustration showing the origin of pickleball in 1965. Bainbridge Island, original wooden paddles, backyard scene. Retro Americana style.",

  "pickleball-glossary":
    "Typography-focused illustration with pickleball terms floating in space: dink, erne, kitchen, rally. Dictionary/glossary book style. Clean modern design.",

  "senior-pickleball-guide":
    "Warm illustration of active senior players enjoying pickleball. Smiling, healthy, energetic. Community atmosphere. Inclusive and welcoming.",

  "junior-pickleball-guide":
    "Fun, colorful illustration of kids and teens playing pickleball. Youth sports energy. Cartoon-friendly style with bright colors.",

  "pickleball-net-guide":
    "Product showcase illustration of pickleball nets: portable, permanent, regulation. Setup details and measurements. Clean product photography.",

  "pickleball-circle-guide":
    "Illustration of a group of friends forming a pickleball circle/club. Social gathering, high-fives, community vibe. Japanese social sports scene.",

  "pickleball-places-japan":
    "Map-style illustration of Japan with pickleball court pins across major cities. Tokyo, Osaka, Nagoya, Fukuoka highlighted. Clean cartography style.",

  "pickleball-health-benefits":
    "Health and fitness infographic illustration. Heart rate, calories burned, flexibility icons around a pickleball player. Medical wellness style.",

  "pickleball-population-japan":
    "Data visualization illustration showing growth of pickleball population in Japan. Rising graph, player silhouettes multiplying. Modern infographic style.",

  "pickleball-vs-padel":
    "Split-screen comparison: padel court (glass walls) on left, pickleball court on right. Equipment comparison. Clean infographic style.",

  "pickleball-experience-guide":
    "Welcoming illustration of a beginner's first pickleball experience event. Instructor teaching, new players trying. Friendly, encouraging atmosphere.",

  "pickleball-lesson-school":
    "Illustration of a pickleball lesson at a sports school. Coach with whiteboard, students on court. Professional instruction atmosphere.",

  "pickleball-cost-guide":
    "Infographic illustration showing pickleball costs: paddle prices, court fees, ball costs. Yen symbols, price tags, budget chart. Clean financial style.",

  "kitchen-nvz-rules":
    "Detailed illustration of the kitchen (non-volley zone) on a pickleball court. Zone highlighted in red/orange, rule annotations. Clear diagram style.",

  "pickleball-improvement-tips":
    "Motivational illustration of a player leveling up in pickleball. Progress stairs, skill icons, improvement arrows. Growth mindset visual.",

  "pickleball-paddle-ranking":
    "Top-10 ranked pickleball paddles displayed on a podium-style ranking. Gold, silver, bronze highlights. Premium product showcase.",

  "pickleball-paddle-beginner":
    "Friendly illustration of beginner-recommended pickleball paddles with price tags. Approachable, not intimidating. Warm colors, simple layout.",

  "pickleball-olympics":
    "Olympic-themed illustration with pickleball. Olympic rings, medal podium, international flags, pickleball court. Grand sporting event style.",

  "pickleball-for-women":
    "Empowering illustration of women playing pickleball. Diverse, athletic, confident. Modern women's sports photography style.",

  "pickleball-corporate-event":
    "Illustration of a corporate team-building event with pickleball. Business casual players, company banners, fun professional atmosphere.",

  "pickleball-family-guide":
    "Warm family illustration: parents and children playing pickleball together. Multi-generational fun. Park setting, weekend leisure.",

  "pickleball-japan-national":
    "Illustration of Japan's national pickleball team in action. Japanese flag, national team uniforms, international competition. Proud, competitive atmosphere.",

  // --- Round 2: 068-083 ---
  "pickleball-celebrities":
    "Glamorous illustration of celebrities and famous people playing pickleball. Red carpet meets sports court. Paparazzi cameras, star players. Entertainment meets athletics.",

  "pickleball-manners":
    "Polite sportsmanship illustration showing pickleball players shaking hands at the net. Good manners icons: bowing, applauding, waiting turn. Japanese etiquette style.",

  "pickleball-tournament-schedule-2026":
    "Calendar-style illustration with 2026 pickleball tournament dates highlighted. Monthly grid, trophy icons, location pins across Japan and world map. Planning style.",

  "pickleball-complete-guide":
    "Comprehensive pickleball overview illustration. Central court with radiating sections: rules, gear, courts, tournaments. Encyclopedia/guidebook visual style.",

  "pickleball-courts-japan":
    "Detailed map of Japan with pickleball court pins in every region. Color-coded by region (Hokkaido blue, Kanto green, Kansai orange, Kyushu red). Clean cartography.",

  "pickleball-rules-complete":
    "Complete rulebook-style illustration. Open book with pickleball court diagrams, scoring tables, kitchen zone highlights. Reference guide visual.",

  "pickleball-gear-guide":
    "Comprehensive gear flat-lay: paddle, balls, shoes, bag, grip tape, water bottle, towel, sunglasses. Organized product photography. Shopping guide style.",

  "pickleball-technique-guide":
    "Multi-panel illustration showing various pickleball techniques: serve, dink, volley, lob, drive. Skill tree or roadmap visual. Progressive difficulty indicators.",

  "pickleball-tournament-guide":
    "Tournament ecosystem illustration: registration form, bracket, trophy, medal podium, crowd. Complete tournament journey visual.",

  "pickleball-doubles-guide":
    "Comprehensive doubles illustration: four players on court with tactical arrows, zones, and formation diagrams. Playbook/strategy book style.",

  "pickleball-for-everyone":
    "Inclusive illustration showing diverse players: senior couple, children, woman in wheelchair, family group, all playing pickleball together. Universal access theme.",

  "kobe-hyogo-pickleball":
    "Illustration of Kobe cityscape with Port Tower and Akashi Kaikyo Bridge, pickleball courts in foreground. Harbor city atmosphere. Japanese regional illustration.",

  "hiroshima-pickleball":
    "Illustration of Hiroshima with Peace Memorial Dome and Itsukushima Shrine torii, pickleball courts nearby. Peaceful, hopeful atmosphere. Japanese regional scene.",

  "okinawa-pickleball":
    "Tropical Okinawa illustration with turquoise ocean, shisa lion statues, and outdoor pickleball court. Palm trees, beach resort atmosphere. Vibrant, sunny.",

  "shizuoka-pickleball":
    "Illustration of Shizuoka with Mt. Fuji in background and green tea fields, pickleball courts in foreground. Serene Japanese countryside sports scene.",

  "ibaraki-pickleball":
    "Illustration of Ibaraki/Tsukuba with science city buildings and Lake Kasumigaura, pickleball courts. Modern suburban Japanese atmosphere.",

  // --- Round 3: 084-100 ---
  "gunma-tochigi-pickleball":
    "Illustration of Gunma/Tochigi with hot spring onsen and Nikko Toshogu shrine, pickleball courts nearby. Mountain scenery, northern Kanto atmosphere.",

  "pickleball-spin-guide":
    "Close-up illustration of a pickleball with spin rotation arrows (topspin, backspin, sidespin). Ball trajectory lines. Physics/tutorial diagram style.",

  "pickleball-backhand-guide":
    "Dynamic illustration of a player hitting a two-handed backhand. Muscle highlights, paddle angle detail. Instructional sports illustration.",

  "pickleball-footwork-guide":
    "Illustration of footwork patterns on a pickleball court. Shoe prints, directional arrows, split step position. Dance-step diagram style.",

  "pickleball-stacking-guide":
    "Top-down tactical diagram showing stacking formation in pickleball doubles. Player positions before and after serve. Xs and Os playbook style.",

  "pickleball-mixed-doubles":
    "Illustration of a mixed doubles team on court. Male and female player in coordinated positions. Partnership and teamwork emphasis. Dynamic sports scene.",

  "pickleball-stretching":
    "Fitness illustration showing stretching exercises specific to pickleball. Pre-game dynamic stretches and post-game static stretches. Wellness/yoga style.",

  "pickleball-training":
    "Gym and court training illustration. Resistance bands, agility ladder, medicine ball, combined with pickleball practice. Strength and conditioning style.",

  "pickleball-mental-guide":
    "Mindfulness and sports psychology illustration. Player meditating, focus visualization, brain with calm waves. Mental strength and concentration theme.",

  "pickleball-starter-kit":
    "Beginner starter kit illustration: affordable paddle, ball tube, basic shoes in a gift box. Price tags, 'starter set' label. Approachable shopping guide.",

  "pickleball-budget-paddle":
    "Price-tiered paddle display: budget (¥3,000), mid-range (¥10,000), premium (¥25,000). Price tags, value indicators. Smart shopping guide style.",

  "pickleball-accessories":
    "Flat-lay of pickleball accessories: grip tape, overgrip, paddle bag, sweatband, sports sunglasses, ball hopper, water bottle. Organized gear layout.",

  "pickleball-vs-tabletennis":
    "Split-screen comparison: table tennis on left (small table, orange ball), pickleball on right (outdoor court, wiffle ball). Clean infographic style.",

  "ppa-tour-guide":
    "Professional pickleball tour illustration. PPA Tour logo style, professional arena, prize money, broadcast cameras. American pro sports atmosphere.",

  "pickleball-noise-guide":
    "Sound wave illustration showing pickleball impact noise. Quiet paddle vs loud paddle comparison. Decibel meter, residential neighborhood. Noise management theme.",

  "pickleball-court-diy":
    "DIY court setup illustration: measuring tape, chalk lines, portable net, tennis court conversion. Step-by-step setup guide visual. Hands-on crafting style.",

  "tennis-to-pickleball":
    "Transition illustration: tennis player walking through a doorway from a tennis court into a pickleball court. Transformation/journey theme. Before and after style.",

  "pickleball-find-partner":
    "Warm illustration of diverse people connecting at a pickleball court, shaking hands and smiling. Community gathering theme. Friendly, welcoming atmosphere. Sky blue and emerald green tones.",

  "pickleball-courts-nearby":
    "Map-style illustration with location pins on a stylized Japan map, each pin showing a pickleball court. Modern cartographic design. Blue and green color scheme.",

  "pickleball-tournament-tokyo":
    "Dynamic illustration of a pickleball tournament scene with Tokyo skyline (Tokyo Tower, Skytree) in background. Players competing on multiple courts. Energetic, competitive atmosphere.",

  "pickleball-experience-tokyo-osaka":
    "Welcoming illustration of beginners at a pickleball experience session. Coach explaining rules, new players trying paddles. Indoor gym setting. Bright, encouraging atmosphere.",

  "pickleball-solo-start":
    "Illustration of a single person confidently walking onto a pickleball court with paddle in hand. Warm sunrise lighting. Encouraging, empowering mood. Path leading to the court.",

  // --- Round 5: 106-115 ---
  "pickleball-age-guide":
    "Infographic illustration showing people of different ages playing pickleball: child, teen, adult, senior. Age progression timeline. Multigenerational activity. Warm, inclusive colors.",

  "pickleball-ben-johns":
    "Dynamic illustration of a male professional pickleball player in action, powerful forehand drive. Stadium lights, tournament court, intense focus. American sports star atmosphere.",

  "pickleball-wheelchair":
    "Inspiring illustration of wheelchair pickleball players on court. Adaptive sports equipment, competitive spirit. Inclusive, empowering atmosphere. Paralympic sports style.",

  "niigata-nagano-pickleball":
    "Illustration of Niigata rice fields and Nagano mountain scenery (Japanese Alps) with pickleball courts. Winter indoor facility visible. Japanese countryside sports scene.",

  "pickleball-tournament-entry":
    "Illustration of a player registering for a tournament on a smartphone. Entry form, QR code, bracket preview. Modern digital registration process. Clean UI design style.",

  "kumamoto-kyushu-pickleball":
    "Illustration of Kumamoto Castle and Sakurajima volcano with pickleball courts in foreground. Southern Kyushu atmosphere. Warm, tropical-tinged Japanese regional scene.",

  "pickleball-ernie-atp":
    "Dynamic illustration of advanced pickleball shots: player lunging outside the court for an Erne, ball curving around the post for ATP. Action lines, dramatic angles. Advanced technique showcase.",

  "pickleball-anna-leigh-waters":
    "Dynamic illustration of a young female professional pickleball player executing a powerful shot. Youthful energy, tournament arena, competitive intensity. American women's sports star atmosphere.",

  "pickleball-university":
    "Energetic illustration of college students playing pickleball on a university campus. Campus buildings, young athletes, club activity vibes. Fun, social, educational atmosphere.",

  "pickleball-brand-paddles":
    "Product showcase illustration of premium pickleball paddles from different brands arranged in a comparison layout. Brand logos, specifications, rating stars. Professional gear review style.",

  // --- Round 6: 116-126 ---
  "pickleball-drill-videos":
    "Illustration of a pickleball player practicing drills with a tablet showing YouTube videos nearby. Cone drills, wall practice, structured practice session. Modern training facility atmosphere.",

  "pickleball-bag-case":
    "Product showcase illustration of various pickleball bags: sling bag, backpack, duffel bag, and tote bag arranged neatly. Paddles and accessories visible inside. Clean product photography style.",

  "pickleball-sunglasses":
    "Stylish illustration of sports sunglasses for pickleball. Multiple lens colors (amber, gray, rose), player wearing wraparound frames on an outdoor court. Bright sunny day, UV protection concept.",

  "pickleball-amazon-rakuten":
    "Illustration of a smartphone screen showing an online shopping cart filled with pickleball gear. Amazon and Rakuten-style product listings. Packages being delivered. E-commerce shopping guide concept.",

  "pickleball-vs-squash":
    "Split-screen illustration comparing pickleball (outdoor court, paddle, wiffle ball) and squash (indoor enclosed court, racquet, rubber ball). Side-by-side comparison infographic style.",

  "pickleball-instagram-sns":
    "Illustration of a smartphone displaying Instagram feed with pickleball content. Social media icons (Instagram, X, TikTok), hashtags floating around. Vibrant social media community atmosphere.",

  "pickleball-podcast":
    "Cozy illustration of someone listening to a pickleball podcast with headphones during commute. Podcast app on smartphone, microphone icon, sound waves. Audio learning concept.",

  "pickleball-books":
    "Illustration of pickleball-related books stacked on a desk with a paddle nearby. Book covers showing court diagrams and player illustrations. Study and learning atmosphere.",

  "pickleball-english":
    "Educational illustration showing pickleball court with English terminology labels. Speech bubbles with phrases like 'Nice shot!', 'Side out!'. Bilingual learning concept, Japanese-English.",

  "pickleball-business-market":
    "Business infographic illustration showing pickleball market growth. Upward trending graphs, dollar signs, facility icons, global expansion map. Professional business analysis style.",

  "pickleball-fun-guide":
    "Joyful illustration of diverse people laughing and high-fiving on a pickleball court. All ages and skill levels, inclusive atmosphere. Warm, inviting, fun recreational sports scene.",
};

/** 全記事スラッグ一覧 */
const ALL_SLUGS = Object.keys(ARTICLE_PROMPTS);

// --- ユーティリティ関数 ---

/**
 * ユーザーに確認を求める（y/N）
 * @param {string} message - 表示するメッセージ
 * @returns {Promise<boolean>} ユーザーが y を入力した場合 true
 */
function confirm(message) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

/**
 * 指定ミリ秒待機する
 * @param {number} ms - 待機時間（ミリ秒）
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Gemini API を呼び出してアイキャッチ画像を生成する
 * @param {string} slug - 記事スラッグ
 * @returns {Promise<{imageData: string, mimeType: string, textResponse: string | null}>}
 */
async function generateImage(slug) {
  const basePrompt = ARTICLE_PROMPTS[slug];
  if (!basePrompt) {
    throw new Error(
      `未知の記事スラッグ: "${slug}"\n有効なスラッグ: ${ALL_SLUGS.join(", ")}`
    );
  }

  const fullPrompt = `${basePrompt} ${PROMPT_SUFFIX}`;

  console.log(`\n🎨 プロンプト: ${fullPrompt}`);
  console.log(`⏳ Gemini API に画像生成をリクエスト中...`);

  // Gemini API リクエスト
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K",
        },
      },
    }),
  });

  // レスポンスのパース
  const data = await response.json();

  // エラーハンドリング
  if (!response.ok || data.error) {
    const errorMessage = data.error?.message || JSON.stringify(data);
    const errorCode = data.error?.code || response.status;

    // 課金関連のエラーの場合、分かりやすいメッセージを表示
    if (
      errorMessage.includes("billing") ||
      errorMessage.includes("quota") ||
      errorCode === 403 ||
      errorCode === 429
    ) {
      console.error(`\n❌ API エラー (${errorCode}): ${errorMessage}`);
      console.error(`\n💡 解決方法:`);
      console.error(
        `   1. Google AI Studio (https://aistudio.google.com/) にアクセス`
      );
      console.error(`   2. 左メニューの「Settings」→「Billing」を開く`);
      console.error(
        `   3. 課金を有効化し、支払い方法を設定する`
      );
      console.error(
        `   4. API キーが有効であることを確認する`
      );
      console.error(
        `\n   ※ Gemini 2.5 Flash の画像生成は有料機能です（無料枠では利用できない場合があります）`
      );
    } else {
      console.error(`\n❌ API エラー (${errorCode}): ${errorMessage}`);
    }

    throw new Error(`API リクエスト失敗: ${errorMessage}`);
  }

  // レスポンスから画像データとテキストを抽出
  const parts = data.candidates?.[0]?.content?.parts;
  if (!parts || parts.length === 0) {
    throw new Error(
      "APIレスポンスにパーツが含まれていません。レスポンス: " +
        JSON.stringify(data, null, 2)
    );
  }

  let imageData = null;
  let mimeType = null;
  let textResponse = null;

  for (const part of parts) {
    if (part.inlineData?.data) {
      // 画像データ（base64）
      imageData = part.inlineData.data;
      mimeType = part.inlineData.mimeType;
    } else if (part.text) {
      // テキストレスポンス（モデルからのコメントなど）
      textResponse = part.text;
    }
  }

  if (!imageData) {
    throw new Error(
      "APIレスポンスに画像データが含まれていません。レスポンス: " +
        JSON.stringify(data, null, 2)
    );
  }

  return { imageData, mimeType, textResponse };
}

/**
 * 画像をファイルに保存する
 * @param {string} slug - 記事スラッグ
 * @param {string} imageData - base64エンコードされた画像データ
 */
async function saveImage(slug, imageData) {
  // 出力ディレクトリが存在しない場合は作成
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`📁 ディレクトリ作成: ${OUTPUT_DIR}`);
  }

  const outputPath = join(OUTPUT_DIR, `${slug}.png`);
  const buffer = Buffer.from(imageData, "base64");
  await writeFile(outputPath, buffer);

  // ファイルサイズを表示
  const fileSizeKB = (buffer.length / 1024).toFixed(1);
  console.log(`✅ 保存完了: ${outputPath} (${fileSizeKB} KB)`);

  return outputPath;
}

/**
 * 1つの記事のアイキャッチ画像を生成する
 * @param {string} slug - 記事スラッグ
 * @returns {Promise<boolean>} 成功した場合 true
 */
async function generateForSlug(slug) {
  try {
    const { imageData, mimeType, textResponse } = await generateImage(slug);

    if (textResponse) {
      console.log(`💬 モデルからのコメント: ${textResponse}`);
    }
    console.log(`🖼️  MIME タイプ: ${mimeType}`);

    await saveImage(slug, imageData);
    return true;
  } catch (error) {
    console.error(`\n❌ "${slug}" の画像生成に失敗: ${error.message}`);
    return false;
  }
}

// --- メイン処理 ---

async function main() {
  // API キーの確認
  if (!API_KEY) {
    console.error("❌ 環境変数 GEMINI_API_KEY が設定されていません。");
    console.error(
      "   使い方: GEMINI_API_KEY=xxx node scripts/generate-eyecatch.mjs <slug>"
    );
    process.exit(1);
  }

  // CLI 引数の取得
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("❌ 記事スラッグまたは --all / --missing を指定してください。");
    console.error("");
    console.error("使い方:");
    console.error(
      "  GEMINI_API_KEY=xxx node scripts/generate-eyecatch.mjs <slug>"
    );
    console.error(
      "  GEMINI_API_KEY=xxx node scripts/generate-eyecatch.mjs --all"
    );
    console.error(
      "  GEMINI_API_KEY=xxx node scripts/generate-eyecatch.mjs --missing       # 未生成のみ"
    );
    console.error(
      "  GEMINI_API_KEY=xxx node scripts/generate-eyecatch.mjs --missing --yes # 確認なし"
    );
    console.error("");
    console.error("有効なスラッグ:");
    for (const slug of ALL_SLUGS) {
      console.error(`  - ${slug}`);
    }
    process.exit(1);
  }

  const isAll = args.includes("--all");
  const isMissing = args.includes("--missing");
  const isYes = args.includes("--yes");

  let slugs;
  if (isMissing) {
    // --missing: 画像ファイルが存在しないスラッグのみ
    slugs = ALL_SLUGS.filter((slug) => !existsSync(join(OUTPUT_DIR, `${slug}.png`)));
    if (slugs.length === 0) {
      console.log("✅ すべてのスラッグに画像が存在します。生成不要です。");
      process.exit(0);
    }
  } else if (isAll) {
    slugs = ALL_SLUGS;
  } else {
    const slug = args.find((a) => !a.startsWith("--"));
    slugs = slug ? [slug] : [];
  }

  if (slugs.length === 0) {
    console.error("❌ 記事スラッグまたは --all / --missing を指定してください。");
    process.exit(1);
  }

  // スラッグの妥当性チェック（単一指定の場合）
  if (!isAll && !isMissing && !ARTICLE_PROMPTS[slugs[0]]) {
    console.error(`❌ 未知の記事スラッグ: "${slugs[0]}"`);
    console.error("");
    console.error("有効なスラッグ:");
    for (const slug of ALL_SLUGS) {
      console.error(`  - ${slug}`);
    }
    process.exit(1);
  }

  // コスト見積もりの表示
  console.log("=".repeat(60));
  console.log("📸 pikura.app アイキャッチ画像生成");
  console.log("=".repeat(60));
  console.log(`\n💰 推定コスト: ¥3-6（$0.02-0.04）/ 1画像`);
  console.log(`📊 生成予定: ${slugs.length} 枚`);

  if (slugs.length > 1) {
    const minCost = slugs.length * 3;
    const maxCost = slugs.length * 6;
    console.log(`💰 合計推定コスト: ¥${minCost}-${maxCost}`);
  }

  console.log(`\n生成対象:`);
  for (const slug of slugs) {
    console.log(`  - ${slug}`);
  }
  console.log(`\n出力先: ${OUTPUT_DIR}/`);

  // ユーザー確認（--yes でスキップ可能）
  if (!isYes) {
    const ok = await confirm("\n以下の画像を生成します。よろしいですか？");
    if (!ok) {
      console.log("キャンセルしました。");
      process.exit(0);
    }
  } else {
    console.log("\n--yes 指定のため確認をスキップします。");
  }

  // 画像生成の実行
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];

    console.log(`\n${"─".repeat(50)}`);
    console.log(
      `📸 [${i + 1}/${slugs.length}] ${slug} を生成中...`
    );

    const success = await generateForSlug(slug);

    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // --all モードの場合、コスト集計を表示
    if (isAll) {
      const minRunningCost = successCount * 3;
      const maxRunningCost = successCount * 6;
      console.log(
        `💰 累計コスト（推定）: ¥${minRunningCost}-${maxRunningCost}（${successCount} 枚成功 / ${failCount} 枚失敗）`
      );

      // 次の生成がある場合は待機（API レートリミット対策）
      if (i < slugs.length - 1) {
        console.log(
          `⏳ ${DELAY_BETWEEN_GENERATIONS_MS / 1000} 秒待機中...`
        );
        await sleep(DELAY_BETWEEN_GENERATIONS_MS);
      }
    }
  }

  // 結果サマリー
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📊 生成結果サマリー`);
  console.log(`   成功: ${successCount} 枚`);
  console.log(`   失敗: ${failCount} 枚`);
  if (successCount > 0) {
    const minTotal = successCount * 3;
    const maxTotal = successCount * 6;
    console.log(`   💰 推定合計コスト: ¥${minTotal}-${maxTotal}`);
  }
  console.log("=".repeat(60));

  // 失敗があった場合は終了コード 1
  if (failCount > 0) {
    process.exit(1);
  }
}

// スクリプト実行
main().catch((error) => {
  console.error("予期しないエラー:", error);
  process.exit(1);
});
