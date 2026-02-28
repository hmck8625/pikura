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
  {
    slug: "osaka-pickleball",
    title: "大阪・関西でピックルボールができる場所まとめ｜施設・体験会・クラブ情報【2026年最新】",
    category: "beginner",
    description:
      "大阪・京都・神戸など関西エリアのピックルボール施設8選。料金・アクセス・初心者対応の有無まで詳しく紹介。",
    file: "016_大阪でピックルボール.md",
  },
  {
    slug: "nagoya-pickleball-courts",
    title: "名古屋・愛知でピックルボールができる場所まとめ｜施設・体験会・クラブ情報【2026年最新】",
    category: "beginner",
    description:
      "名古屋・愛知でピックルボールができる施設を網羅。ノア名古屋瓢箪山校、Nagoya Pickleball Base、セントラル一社など料金・アクセス・初心者向け情報を詳しく紹介。",
    file: "017_名古屋でピックルボール.md",
  },
  {
    slug: "pickleball-serve-guide",
    title: "ピックルボールのサーブ完全ガイド｜種類・打ち方・コツを徹底解説【2026年最新ルール対応】",
    category: "tips",
    description:
      "ピックルボールのサーブを初心者〜中級者向けに徹底解説。2026年最新ルール、6種類のサーブの打ち方、練習ドリル、プロ選手のサーブ分析まで完全網羅。",
    file: "018_サーブ完全ガイド.md",
  },
  {
    slug: "pickleball-vs-tennis",
    title: "ピックルボール vs テニス｜7つの違いを徹底比較【テニス経験者必見】",
    category: "beginner",
    description:
      "ピックルボールとテニスの違いをコートサイズ・道具・ルール・運動量・費用・競技人口の7項目で徹底比較。テニス経験者が活かせるスキルと注意すべき癖も解説。",
    file: "019_テニスとの違い.md",
  },
  {
    slug: "dupr-japan-guide",
    title: "DUPRとは？ピックルボールの世界基準ランキングを日本で活用する完全ガイド【2026年版】",
    category: "tips",
    description:
      "DUPR（Dynamic Universal Pickleball Rating）の仕組み、レーティング計算方法、日本での登録手順、スコアの見方を徹底解説。JPA連携やpikura.appランキングとの関連も網羅。",
    file: "020_DUPRとは.md",
  },
  {
    slug: "kanagawa-pickleball-courts",
    title: "神奈川・横浜でピックルボールができる施設ガイド｜コート・料金・体験会情報【2026年版】",
    category: "beginner",
    description:
      "神奈川県でピックルボールができる施設を完全網羅。横浜・川崎・湘南・鎌倉エリア別に、コート情報、料金、アクセス、初心者体験会の有無を詳しく紹介。",
    file: "021_神奈川でピックルボール.md",
  },
  {
    slug: "dink-guide",
    title: "ピックルボールのディンク完全ガイド｜打ち方・練習ドリル・上級テクニックを徹底解説",
    category: "tips",
    description:
      "ピックルボールのディンクを初心者から上級者まで段階的に解説。基本の打ち方、5つの練習ドリル、よくある間違い、クロスコートディンクやアタッカブルディンクなどの上級テクニックまで完全網羅。",
    file: "022_ディンク完全ガイド.md",
  },
  {
    slug: "doubles-rules",
    title: "ピックルボール ダブルスルール完全解説｜サーブ順・スコアコール・FAQ【2026年最新版】",
    category: "rules",
    description:
      "ピックルボールのダブルス特有ルールを初心者向けに完全解説。サービングシーケンス、0-0-2の意味、サーバー交代、キッチンルール、ラリーポイント制まで、よくある疑問をFAQ形式で徹底カバー。",
    file: "023_ダブルスルール完全解説.md",
  },
  {
    slug: "court-reservation-guide",
    title: "ピックルボールコートの予約方法ガイド｜公共施設・民間施設・テニスコート活用術【2026年版】",
    category: "beginner",
    description:
      "ピックルボールコートの予約方法を徹底解説。公共施設の予約システム登録手順、民間施設の予約方法、テニスコートの転用方法、人気コートを確実に押さえる7つのコツまで。",
    file: "024_コート予約ガイド.md",
  },
  {
    slug: "practice-drills",
    title: "ピックルボール初心者〜中級者向け練習ドリル10選｜1人・2人・4人でできるメニュー",
    category: "tips",
    description:
      "ピックルボールの効果的な練習ドリル10選を紹介。1人でできる壁打ち・サーブ練習から、2人ペアのディンクラリー、4人でのシチュエーション練習まで目的別に完全網羅。",
    file: "025_練習ドリル10選.md",
  },
  {
    slug: "scoring-guide",
    title: "ピックルボールのスコアの数え方完全解説｜「0-0-2」の意味からラリーポイント制まで",
    category: "rules",
    description:
      "ピックルボールの独特なスコアリングシステムを徹底解説。ダブルスの3桁スコア「0-0-2」の意味、シングルスとの違い、サイドアウトの仕組み、ラリーポイント制（MLP形式）まで完全網羅。",
    file: "026_スコアの数え方.md",
  },
  {
    slug: "third-shot-drop",
    title: "ピックルボール3rdショットドロップ完全ガイド｜打ち方・練習法・使い分けを徹底解説",
    category: "tips",
    description:
      "3rdショットドロップの戦術的背景から具体的な打ち方、3rdショットドライブとの使い分け、5つの実践的な練習法、よくある失敗パターンと改善方法まで徹底解説。",
    file: "027_3rdショットドロップ.md",
  },
  {
    slug: "pickleball-wear-guide",
    title: "ピックルボールのウェア・服装ガイド｜大会ドレスコードからおすすめブランドまで【2026年版】",
    category: "gear",
    description:
      "ピックルボールのウェア・服装を徹底解説。公式大会のドレスコード、おすすめブランド（ミズノ・アシックス・ヨネックス等）、季節別の服装アドバイス、インドア/アウトドア別の注意点まで完全網羅。",
    file: "028_ウェアガイド.md",
  },
  {
    slug: "wall-practice-guide",
    title: "ピックルボールの壁打ち練習ガイド｜一人でできるドリル5選と場所の探し方【2026年版】",
    category: "tips",
    description:
      "ピックルボールの壁打ち練習を徹底解説。一人でできる基本ドリル5つ、壁の選び方、距離と高さの目安、練習場所の探し方まで完全網羅。",
    file: "029_壁打ちガイド.md",
  },
  {
    slug: "ball-guide",
    title: "ピックルボールの選び方ガイド｜屋内用・屋外用の違いとおすすめボール【2026年版】",
    category: "gear",
    description:
      "ピックルボールの選び方を徹底解説。屋内用と屋外用の違い、主要ブランド（Franklin X-40、Dura Fast 40、ONIX等）、公式大会使用ボール、初心者向けおすすめと購入先まで完全網羅。",
    file: "030_ボールの選び方.md",
  },
  {
    slug: "fukuoka-pickleball-courts",
    title: "福岡・九州でピックルボールができる場所まとめ｜施設・体験会・料金ガイド【2026年版】",
    category: "beginner",
    description:
      "福岡・九州でピックルボールができる施設を徹底紹介。体育館、コート情報、九州ピックルボール協会の活動、体験会情報、料金・アクセス・初心者対応まで完全網羅。",
    file: "031_福岡でピックルボール.md",
  },
  {
    slug: "saitama-chiba-pickleball",
    title: "埼玉・千葉でピックルボールができる場所まとめ｜施設・クラブ・イベント情報【2026年最新】",
    category: "beginner",
    description:
      "埼玉・千葉でピックルボールができる施設を網羅。WELL PICKLE CLUB、柏TTC、加須市民体育館など料金・アクセス・初心者向け情報を詳しく紹介。",
    file: "032_埼玉千葉でピックルボール.md",
  },
  {
    slug: "mlp-pickleball-guide",
    title: "MLP（Major League Pickleball）完全ガイド｜チーム制リーグの仕組みと視聴方法【2026年版】",
    category: "tips",
    description:
      "MLP（Major League Pickleball）の仕組み・歴史・チーム一覧・ドラフト制度・PPA Tourとの統合・視聴方法を日本語で徹底解説。船水雄太選手の参戦情報も。",
    file: "033_MLPとは.md",
  },
  {
    slug: "injury-prevention",
    title: "ピックルボールの怪我予防ガイド｜肘・膝・肩の痛みを防ぐストレッチと対策【完全版】",
    category: "tips",
    description:
      "ピックルボールで起こりやすい怪我の種類と具体的な予防方法を詳しく解説。ウォーミングアップ、ストレッチ、筋トレ、適切なギア選び、プレー中の注意点まで完全網羅。",
    file: "034_怪我予防ガイド.md",
  },
  {
    slug: "certification-guide",
    title: "ピックルボールの資格・審判ガイド｜JPA公認審判員・コーチ資格の取得方法と費用【2026年版】",
    category: "events",
    description:
      "ピックルボールの審判資格・コーチ資格を網羅的に解説。JPA公認審判員、PPR、IPTPAなどの取得方法・費用・受験要件から、資格を活かしたキャリアパスまで。",
    file: "035_資格ガイド.md",
  },
  {
    slug: "return-guide",
    title:
      "ピックルボールのリターン完全ガイド｜レシーブの打ち方・戦術・練習法を徹底解説【2026年最新】",
    category: "tips",
    description:
      "ピックルボールのリターン（レシーブ）を初心者〜中級者向けに徹底解説。基本姿勢・打ち方、ディープリターンの重要性、キッチンへのアプローチ、ダブルス戦術、練習ドリルまで完全網羅。",
    file: "036_リターン完全ガイド.md",
  },
  {
    slug: "volley-guide",
    title:
      "ピックルボールのボレー完全ガイド｜打ち方・種類・ハンドバトル対処法を徹底解説【2026年最新】",
    category: "tips",
    description:
      "ピックルボールのボレーを初心者〜上級者向けに徹底解説。パンチボレー、ブロックボレー、ドロップボレーの打ち方から、ハンドバトルの対処法、リセットショット、練習ドリルまで完全網羅。",
    file: "037_ボレー完全ガイド.md",
  },
  {
    slug: "lob-guide",
    title:
      "ピックルボールのロブ完全ガイド｜打ち方・種類・対処法・戦術を徹底解説【2026年最新】",
    category: "tips",
    description:
      "ピックルボールのロブを初心者〜上級者向けに徹底解説。ディフェンシブロブとオフェンシブロブの打ち方、使うタイミング、ロブへの対処法（オーバーヘッドスマッシュ）、ロブを使った戦術まで完全網羅。",
    file: "038_ロブの打ち方.md",
  },
  {
    slug: "singles-tactics",
    title:
      "ピックルボールのシングルス戦術完全ガイド｜ルール・ポジショニング・戦略を徹底解説【2026年最新】",
    category: "tips",
    description:
      "ピックルボールのシングルス戦術を初心者〜上級者向けに徹底解説。ダブルスとのルールの違い、基本ポジショニング、サーブ戦略、3rdショットの選択、体力マネジメント、練習メニューまで完全網羅。",
    file: "039_シングルス戦術ガイド.md",
  },
  {
    slug: "positioning-guide",
    title:
      "ピックルボールのポジショニング完全ガイド｜ダブルスの立ち位置・動き方を徹底解説【2026年最新】",
    category: "tips",
    description:
      "ピックルボールのダブルスにおけるポジショニング（立ち位置）を徹底解説。サーブ時・リターン時・ディンクラリー時の基本ポジション、キッチンラインの重要性、スタッキング、コートカバレッジの考え方まで完全網羅。",
    file: "040_ポジショニングガイド.md",
  },
  {
    slug: "grip-guide",
    title:
      "ピックルボールのグリップ完全ガイド｜握り方の種類・ショット別の使い分け・よくある間違いを徹底解説【2026年最新】",
    category: "tips",
    description:
      "ピックルボールのグリップ（握り方）を徹底解説。コンチネンタル・イースタン・ウエスタンの違い、サーブ・ディンク・ドライブ・ボレー別の使い分け、グリップ圧の重要性、テニス経験者がやりがちな間違いまで完全網羅。",
    file: "041_グリップの握り方.md",
  },
  {
    slug: "hokkaido-pickleball",
    title:
      "北海道・札幌でピックルボールができる場所まとめ｜施設・クラブ・体験会情報【2026年最新】",
    category: "beginner",
    description:
      "北海道（特に札幌エリア）でピックルボールができる施設・体育館・クラブ情報を網羅的に紹介。冬季の屋内施設、北海道ピックルボール協会の活動、体験会情報、コート予約方法まで完全ガイド。",
    file: "042_北海道でピックルボール.md",
  },
  {
    slug: "kyoto-pickleball",
    title:
      "京都でピックルボールができる場所まとめ｜施設・スクール・体験会情報【2026年最新】",
    category: "beginner",
    description:
      "京都でピックルボールができる施設・スクール情報を網羅的に紹介。京都トップディンク（TopDink）のスクール情報、京都府の体育施設でのピックルボール開放日、観光と組み合わせたプレー提案まで完全ガイド。",
    file: "043_京都でピックルボール.md",
  },
  {
    slug: "sendai-tohoku-pickleball",
    title:
      "仙台・東北でピックルボールができる場所まとめ｜施設・クラブ・体験会情報【2026年最新】",
    category: "beginner",
    description:
      "仙台・宮城・東北エリアでピックルボールができる施設・クラブ・体験会情報を網羅。宮城県ピックルボール協会の活動、体育館・公園コート情報、初心者向けの始め方まで詳しく解説。",
    file: "044_仙台東北でピックルボール.md",
  },
  {
    slug: "pickleball-vs-badminton",
    title:
      "ピックルボールとバドミントンの7つの違いを徹底比較｜経験者が活かせるスキルも解説【2026年最新】",
    category: "beginner",
    description:
      "ピックルボールとバドミントンの違いをコート・道具・ルール・運動量・難易度・費用・競技人口の7項目で徹底比較。バドミントン経験者がピックルボールで活かせるスキルと注意点も詳しく解説。",
    file: "045_バドミントンとの違い.md",
  },
  {
    slug: "pickleball-history",
    title:
      "ピックルボールの歴史と起源｜1965年の発明からオリンピックへの道のり【2026年最新】",
    category: "beginner",
    description:
      "ピックルボールの歴史を1965年の発明から現在まで完全解説。名前の由来（ピックルボート説・犬の名前説）、アメリカでの爆発的成長、日本での普及の歩み、オリンピック種目入りの最新情報まで網羅。",
    file: "046_ピックルボールの歴史.md",
  },
  {
    slug: "pickleball-glossary",
    title:
      "ピックルボール用語集｜50語以上を完全網羅【初心者からプロまで使える2026年最新版】",
    category: "rules",
    description:
      "ピックルボールの用語を50語以上収録した完全用語集。基本ルール用語、ショット名、戦略用語、競技用語をアルファベット順・カテゴリ別で解説。初心者からプロ志向のプレイヤーまで必携の用語辞典。",
    file: "047_用語集.md",
  },
  {
    slug: "senior-pickleball-guide",
    title:
      "シニアのためのピックルボール完全ガイド｜50代・60代・70代から始める低衝撃スポーツ",
    category: "beginner",
    description:
      "50代以上のシニア世代がピックルボールを安全に始めるための完全ガイド。低衝撃で関節に優しい理由、認知機能維持の効果、シニア向けパドル・シューズ選び、50+カテゴリの大会情報まで徹底解説。",
    file: "048_シニアのためのピックルボール.md",
  },
  {
    slug: "junior-pickleball-guide",
    title:
      "ジュニアのためのピックルボール完全ガイド｜子供の年齢別の始め方と親子で楽しむ方法",
    category: "beginner",
    description:
      "子供・ジュニアがピックルボールを始めるメリットと年齢別の始め方を徹底解説。未就学児・小学生・中高生それぞれの取り組み方、ジュニア用パドルの選び方、親子で楽しむコツ、学校体育での導入事例、ジュニア大会情報まで。",
    file: "049_ジュニアのピックルボール.md",
  },
  {
    slug: "pickleball-net-guide",
    title:
      "ピックルボールネットの選び方完全ガイド｜公式サイズ・高さとおすすめポータブルネット5選",
    category: "gear",
    description:
      "ピックルボールネットの公式サイズ（横6.7m×高さ91.4cm）、テニスネットとの違い、ポータブルネットのおすすめ5選（¥5,000〜¥30,000）、自宅や公園での設置方法まで徹底解説。",
    file: "050_ネットの選び方.md",
  },
  {
    slug: "pickleball-circle-guide",
    title:
      "ピックルボールサークルの探し方完全ガイド｜仲間を見つけて一緒に楽しもう",
    category: "beginner",
    description:
      "ピックルボールのサークル・クラブの探し方を徹底解説。テニスベア・Instagram・Facebook・JPA加盟団体の活用法、サークルの選び方、自分でサークルを立ち上げる方法、ペア募集のコツまで完全網羅。",
    file: "051_サークルの探し方.md",
  },
  {
    slug: "pickleball-places-japan",
    title: "日本全国でピックルボールができる場所まとめ｜コート・施設ガイド【2026年最新】",
    category: "beginner",
    description: "北海道から沖縄まで日本全国のピックルボールコート・施設を地方別にまとめ。専用コートとテニスコート転用の違い、コートの探し方も解説。",
    file: "052_日本全国のピックルボールコート.md",
  },
  {
    slug: "pickleball-health-benefits",
    title: "ピックルボールの健康効果｜ダイエット・カロリー消費・認知機能改善を徹底解説【2026年最新】",
    category: "beginner",
    description: "ピックルボールの健康効果を科学的に解説。カロリー消費量、ダイエット効果、心肺機能向上、認知機能改善、ストレス解消まで完全網羅。",
    file: "053_ピックルボールの健康効果.md",
  },
  {
    slug: "pickleball-population-japan",
    title: "ピックルボールの競技人口｜日本5万人・世界6,000万人の最新データ【2026年版】",
    category: "beginner",
    description: "ピックルボールの競技人口を日本と世界で徹底解説。アメリカ4,860万人、日本推定5万人の推移と成長予測。",
    file: "054_ピックルボール競技人口.md",
  },
  {
    slug: "pickleball-vs-padel",
    title: "ピックルボールとパデルの7つの違いを徹底比較｜どっちを始めるべき？【2026年最新】",
    category: "beginner",
    description: "ピックルボールとパデルの違いをコート・道具・ルール・運動量・費用・普及状況・始めやすさの7項目で徹底比較。",
    file: "055_パデルとの違い.md",
  },
  {
    slug: "pickleball-experience-guide",
    title: "ピックルボール体験会ガイド｜初めての参加方法・持ち物・全国の開催情報【2026年最新】",
    category: "beginner",
    description: "ピックルボール体験会の探し方・参加方法を徹底解説。体験会の流れ、持ち物、費用、全国の主要体験会開催団体まで。",
    file: "056_体験会ガイド.md",
  },
  {
    slug: "pickleball-lesson-school",
    title: "ピックルボールのスクール・レッスンガイド｜全国の教室・料金・選び方【2026年最新】",
    category: "beginner",
    description: "ピックルボールのスクール・レッスン情報を徹底解説。全国の主要スクール、料金相場、選び方のポイントまで。",
    file: "057_スクール・レッスンガイド.md",
  },
  {
    slug: "pickleball-cost-guide",
    title: "ピックルボールにかかる費用ガイド｜初期費用・月額費用・他スポーツとの比較【2026年版】",
    category: "beginner",
    description: "ピックルボールの費用を完全ガイド。初期費用、月額費用、大会参加費、テニスやゴルフとの費用比較まで。¥10,000で始められる。",
    file: "058_費用ガイド.md",
  },
  {
    slug: "kitchen-nvz-rules",
    title: "ピックルボールのキッチン（ノンボレーゾーン）ルール完全解説｜7つの主要ルールとよくある違反例",
    category: "rules",
    description: "キッチン（NVZ）ルールを完全解説。7つの主要ルール、よくある違反例、戦略的意味まで徹底解説。",
    file: "059_キッチンルール.md",
  },
  {
    slug: "pickleball-improvement-tips",
    title: "ピックルボール上達のための10のコツ｜初心者→中級者へのステップアップ【2026年版】",
    category: "tips",
    description: "ピックルボール上達の10のコツ。キッチンライン、ソフトゲーム、フットワーク、グリップ圧、サーブ安定性など実践的なアドバイスを完全網羅。",
    file: "060_上達のコツ.md",
  },
  {
    slug: "pickleball-paddle-ranking",
    title: "ピックルボールパドル人気ランキングTOP10｜2026年版おすすめ徹底比較",
    category: "gear",
    description: "2026年版ピックルボールパドル人気ランキングTOP10。JOOLA、Selkirk、Franklin等を徹底比較。価格帯別・レベル別おすすめも。",
    file: "061_パドルランキング.md",
  },
  {
    slug: "pickleball-paddle-beginner",
    title: "初心者向けピックルボールパドルの選び方｜予算別おすすめ5選【2026年版】",
    category: "gear",
    description: "初心者向けパドルの選び方を徹底解説。初心者パドルの条件、予算別おすすめ5選、テニス/バドミントン経験者向けの選び方まで。",
    file: "062_初心者パドル.md",
  },
  {
    slug: "pickleball-olympics",
    title: "ピックルボールのオリンピック種目入り最新動向｜2028ロス五輪・2032ブリスベン五輪の可能性",
    category: "beginner",
    description: "ピックルボールのオリンピック種目入りの最新動向。IOCの検討状況、IFPの取り組み、2028年・2032年の見通しを徹底解説。",
    file: "063_オリンピック.md",
  },
  {
    slug: "pickleball-for-women",
    title: "女性のためのピックルボールガイド｜始め方・パドル選び・レディース大会情報【2026年版】",
    category: "beginner",
    description: "女性にピックルボールが人気な理由、女性向けパドル・ウェア選び、レディース大会情報、女性コミュニティまで完全ガイド。",
    file: "064_女性向けガイド.md",
  },
  {
    slug: "pickleball-corporate-event",
    title: "ピックルボールを企業イベント・チームビルディングに｜導入メリット・開催方法・費用【完全ガイド】",
    category: "beginner",
    description: "ピックルボールを企業イベントに活用する方法。導入メリット、開催の流れ、費用目安、企業導入事例まで。",
    file: "065_企業イベント向け.md",
  },
  {
    slug: "pickleball-family-guide",
    title: "親子・家族でピックルボール｜3世代で楽しめるスポーツの始め方【2026年版】",
    category: "beginner",
    description: "親子・家族でピックルボールを楽しむガイド。家族スポーツとしての魅力、道具選び、家族向けイベント情報まで。",
    file: "066_親子・家族ガイド.md",
  },
  {
    slug: "pickleball-japan-national",
    title: "ピックルボール日本代表選手まとめ｜選考方法・国際大会成績・今後の展望【2026年最新】",
    category: "players",
    description: "ピックルボール日本代表選手のプロフィール、選考方法、国際大会での成績、船水雄太選手の活躍まで。",
    file: "067_日本代表.md",
  },
  // --- Round 2: 068-083 ---
  {
    slug: "pickleball-celebrities",
    title: "ピックルボールをプレーする芸能人・有名人まとめ｜海外セレブから日本の芸能人まで【2026年最新】",
    category: "beginner",
    description: "ピックルボールをプレーする芸能人・有名人を海外セレブから日本の芸能人まで網羅的に紹介。レブロン・ジェームズ、ビル・ゲイツの事例まで。",
    file: "068_芸能人とピックルボール.md",
  },
  {
    slug: "pickleball-manners",
    title: "ピックルボールのマナー・エチケット完全ガイド｜試合前後・練習・公共施設での振る舞い方",
    category: "rules",
    description: "ピックルボールのマナーとエチケットを試合前・試合中・試合後・練習時・公共施設利用時に分けて徹底解説。",
    file: "069_マナーガイド.md",
  },
  {
    slug: "pickleball-tournament-schedule-2026",
    title: "【2026年】ピックルボール大会スケジュール一覧｜国内・海外の主要大会まとめ",
    category: "events",
    description: "2026年のピックルボール大会スケジュールを月別に網羅。JPA公式戦、地方大会からPPA Tour、世界選手権まで。",
    file: "070_大会スケジュール2026.md",
  },
  {
    slug: "pickleball-complete-guide",
    title: "ピックルボール完全ガイド｜始め方・ルール・道具・コート・大会まで全てがわかる【2026年最新】",
    category: "beginner",
    description: "ピックルボールの全てを1ページで把握できる完全ガイド。基本ルールから大会参加、費用、健康効果まで網羅。",
    file: "071_ピックルボール完全ガイド.md",
  },
  {
    slug: "pickleball-courts-japan",
    title: "【2026年版】ピックルボールコート全国ガイド｜日本全国の施設・できる場所を地方別に完全網羅",
    category: "beginner",
    description: "日本全国のピックルボールコート・施設を北海道から沖縄まで地方別に徹底ガイド。コートの探し方・予約方法まで。",
    file: "072_全国コートガイド.md",
  },
  {
    slug: "pickleball-rules-complete",
    title: "【2026年版】ピックルボールのルール完全ガイド｜サーブ・スコア・キッチン・ダブルスまで一挙解説",
    category: "rules",
    description: "ピックルボールの全ルールを1ページで完全解説。サーブ、スコアリング、キッチン、ダブルス・シングルス特有ルールまで。",
    file: "073_ルール完全ガイド.md",
  },
  {
    slug: "pickleball-gear-guide",
    title: "【2026年版】ピックルボールの道具・用品完全ガイド｜必要なものリストから選び方・購入先まで",
    category: "gear",
    description: "ピックルボールに必要な道具・用品を完全ガイド。パドル、シューズ、ボール、ウェア、ネット、購入先まで網羅。",
    file: "074_ギア完全ガイド.md",
  },
  {
    slug: "pickleball-technique-guide",
    title: "【2026年版】ピックルボールのテクニック・戦術 総まとめ｜初心者から上級者までのレベル別ロードマップ",
    category: "tips",
    description: "ピックルボールの全テクニックと戦術を1ページで網羅。基本ショットからダブルス戦術、レベル別ロードマップまで。",
    file: "075_テクニック総まとめ.md",
  },
  {
    slug: "pickleball-tournament-guide",
    title: "ピックルボール大会完全ガイド｜種類・エントリー方法・ランキング・世界大会まで網羅【2026年版】",
    category: "events",
    description: "ピックルボール大会の全てを解説。JPA公式大会・草トーの種類、エントリー方法、ランキング、世界大会まで完全網羅。",
    file: "076_大会完全ガイド.md",
  },
  {
    slug: "pickleball-doubles-guide",
    title: "ピックルボール ダブルス完全攻略ガイド｜ルール・戦術・ポジショニング・ディンク戦まで網羅【2026年版】",
    category: "tips",
    description: "ピックルボールダブルスの全てを解説。ルール、戦術、ポジショニング、3rdショットドロップ、ディンク戦まで完全網羅。",
    file: "077_ダブルス完全攻略.md",
  },
  {
    slug: "pickleball-for-everyone",
    title: "ピックルボールは誰でもできる｜シニア・子供・女性・家族・車椅子まで対象者別完全ガイド【2026年版】",
    category: "beginner",
    description: "ピックルボールがあらゆる人に開かれたスポーツである理由を対象者別に解説。シニア、ジュニア、女性、家族、車椅子まで。",
    file: "078_誰でもできるピックルボール.md",
  },
  {
    slug: "kobe-hyogo-pickleball",
    title: "兵庫・神戸でピックルボールができる場所まとめ｜施設・体験会・サークル情報【2026年版】",
    category: "beginner",
    description: "兵庫県・神戸市でピックルボールができる施設を徹底紹介。神戸市立体育館、PICKLED、テニスクラブ、姫路エリアまで。",
    file: "079_兵庫神戸でピックルボール.md",
  },
  {
    slug: "hiroshima-pickleball",
    title: "広島・中国地方でピックルボールができる場所まとめ｜施設・体験会・クラブ情報【2026年版】",
    category: "beginner",
    description: "広島でピックルボールができる施設を徹底紹介。広島市・福山市の体育館、中国地方の状況もカバー。",
    file: "080_広島でピックルボール.md",
  },
  {
    slug: "okinawa-pickleball",
    title: "沖縄でピックルボールができる場所まとめ｜リゾートPB・施設・体験会ガイド【2026年版】",
    category: "beginner",
    description: "沖縄でピックルボールができる施設を徹底紹介。那覇・北谷エリアの施設、リゾート×ピックルボールの楽しみ方まで。",
    file: "081_沖縄でピックルボール.md",
  },
  {
    slug: "shizuoka-pickleball",
    title: "静岡でピックルボールができる場所まとめ｜浜松・熱海・伊豆の施設ガイド【2026年版】",
    category: "beginner",
    description: "静岡でピックルボールができる施設を徹底紹介。浜松市・静岡市の体育館、熱海・伊豆のリゾート施設まで。",
    file: "082_静岡でピックルボール.md",
  },
  {
    slug: "ibaraki-pickleball",
    title: "茨城・つくばでピックルボールができる場所まとめ｜施設・サークル・体験会ガイド【2026年版】",
    category: "beginner",
    description: "茨城県でピックルボールができる施設を徹底紹介。つくば市・水戸市の体育施設、サークル情報、首都圏からのアクセスまで。",
    file: "083_茨城でピックルボール.md",
  },
  // --- Round 3: 084-100 ---
  {
    slug: "gunma-tochigi-pickleball",
    title: "群馬・栃木でピックルボールができる場所まとめ｜前橋・高崎・宇都宮の施設・体験会ガイド【2026年版】",
    category: "beginner",
    description: "群馬県・栃木県でピックルボールができる施設を徹底紹介。前橋・高崎・宇都宮の体育施設、サークル・体験会情報まで。",
    file: "084_群馬栃木でピックルボール.md",
  },
  {
    slug: "pickleball-spin-guide",
    title: "ピックルボールのスピンショット完全ガイド｜トップスピン・バックスピン・サイドスピンの打ち方と戦術【2026年版】",
    category: "tips",
    description: "ピックルボールのスピンショットを徹底解説。トップスピン・バックスピン・サイドスピンの打ち方、スピンサーブのコツまで。",
    file: "085_スピンガイド.md",
  },
  {
    slug: "pickleball-backhand-guide",
    title: "ピックルボールのバックハンド完全ガイド｜片手・両手の打ち方、ドライブ・ディンク・ボレーのコツ【2026年版】",
    category: "tips",
    description: "ピックルボールのバックハンドを徹底解説。片手と両手の違い、ドライブ・ディンク・ボレーの打ち方、苦手克服のコツまで。",
    file: "086_バックハンドガイド.md",
  },
  {
    slug: "pickleball-footwork-guide",
    title: "ピックルボールのフットワーク完全ガイド｜基本ステップ・ネットへの移動・キッチンライン際の動き方【2026年版】",
    category: "tips",
    description: "ピックルボールのフットワークを徹底解説。スプリットステップ、サイドステップ、ネットアプローチの効率的な方法まで。",
    file: "087_フットワークガイド.md",
  },
  {
    slug: "pickleball-stacking-guide",
    title: "ピックルボールのスタッキング戦術完全ガイド｜フォアハンド側を確保して試合を有利に進める方法【2026年版】",
    category: "tips",
    description: "ピックルボールのスタッキング戦術を徹底解説。基本概念、サーブ時・リターン時のスタッキング、ハーフスタッキングまで。",
    file: "088_スタッキング戦術.md",
  },
  {
    slug: "pickleball-mixed-doubles",
    title: "ピックルボール ミックスダブルス戦術ガイド｜男女ペアで勝つためのフォーメーションと考え方【2026年版】",
    category: "tips",
    description: "ピックルボールのミックスダブルス戦術を徹底解説。男女の役割分担、フォーメーション、ペアのコミュニケーション術まで。",
    file: "089_ミックスダブルス戦術.md",
  },
  {
    slug: "pickleball-stretching",
    title: "ピックルボール前後のストレッチ・ウォームアップ完全ガイド｜怪我予防と柔軟性アップ【2026年版】",
    category: "tips",
    description: "ピックルボールのプレー前の動的ストレッチ5種、プレー後の静的ストレッチ5種、ウォームアップメニューを詳しく解説。",
    file: "090_ストレッチ・ウォームアップ.md",
  },
  {
    slug: "pickleball-training",
    title: "ピックルボールのための体力トレーニング｜自宅・ジムで強くなるメニュー【2026年版】",
    category: "tips",
    description: "ピックルボールに必要な体力要素を分析し、自宅・ジムで行えるトレーニングメニューと週間プランを紹介。",
    file: "091_体力トレーニング.md",
  },
  {
    slug: "pickleball-mental-guide",
    title: "ピックルボールのメンタル完全ガイド｜試合で緊張・ミスに負けない心の作り方【2026年版】",
    category: "tips",
    description: "ピックルボールの試合中のメンタルコントロール術を徹底解説。ミスからの立て直し、緊張への対処法、集中力維持まで。",
    file: "092_メンタルガイド.md",
  },
  {
    slug: "pickleball-starter-kit",
    title: "ピックルボール初心者のためのスターターキットガイド｜予算別おすすめセットと賢い買い物術【2026年版】",
    category: "gear",
    description: "ピックルボールを始めるために必要な道具を徹底解説。予算別セット、Amazon・楽天のおすすめ商品、買わなくていいものまで。",
    file: "093_スターターキット.md",
  },
  {
    slug: "pickleball-budget-paddle",
    title: "予算別ピックルボールパドルガイド｜価格帯ごとの特徴とおすすめモデル【2026年版】",
    category: "gear",
    description: "ピックルボールパドルを価格帯別に徹底解説。5千円以下から3万円以上まで、各価格帯の特徴とおすすめパドルを紹介。",
    file: "094_予算別パドルガイド.md",
  },
  {
    slug: "pickleball-accessories",
    title: "ピックルボールのアクセサリー・便利グッズガイド｜快適プレーのための必需品【2026年版】",
    category: "gear",
    description: "ピックルボールのアクセサリーを徹底紹介。グリップテープ、バッグ、サングラス、プロテクター、冷感グッズまで。",
    file: "095_アクセサリーガイド.md",
  },
  {
    slug: "pickleball-vs-tabletennis",
    title: "ピックルボールと卓球の比較｜卓球経験者が活かせるスキルと転向ガイド【2026年版】",
    category: "beginner",
    description: "ピックルボールと卓球のコート・道具・ルールを比較。卓球経験者がPBに活かせるスキルと転向のコツを解説。",
    file: "096_ピックルボールvs卓球.md",
  },
  {
    slug: "ppa-tour-guide",
    title: "PPA Tour完全ガイド｜プロピックルボール協会のツアー・選手・賞金・視聴方法を徹底解説【2026年版】",
    category: "events",
    description: "PPA Tourの仕組み、2026年ツアースケジュール、注目選手、賞金体系、視聴方法、日本人選手の参戦可能性まで。",
    file: "097_PPAツアーガイド.md",
  },
  {
    slug: "pickleball-noise-guide",
    title: "ピックルボールの騒音問題と対策ガイド｜静音パドル・ボール・近隣配慮のすべて【2026年版】",
    category: "beginner",
    description: "ピックルボールの騒音問題の原因と対策を徹底解説。静音パドル・静音ボールの選び方、住宅地での配慮まで。",
    file: "098_騒音問題ガイド.md",
  },
  {
    slug: "pickleball-court-diy",
    title: "ピックルボールコートのDIY設営ガイド｜テニスコート・体育館・庭での作り方【2026年版】",
    category: "beginner",
    description: "ピックルボールコートのDIY設営を徹底解説。テニスコートへのライン引き、体育館での設営、ポータブルネットの選び方まで。",
    file: "099_コートDIYガイド.md",
  },
  {
    slug: "tennis-to-pickleball",
    title: "テニス経験者のためのピックルボール転向ガイド｜活きるスキルと注意点【2026年版】",
    category: "beginner",
    description: "テニス経験者がピックルボールに転向する際のガイド。活かせる技術、邪魔になる癖、転向のコツ、両立方法まで。",
    file: "100_テニスからの転向ガイド.md",
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
const SITE_URL = "https://pikura.app";

async function upsertArticle(article, index, total) {
  const mdPath = resolve(ARTICLES_DIR, article.file);
  let markdown = readFileSync(mdPath, "utf-8");

  // frontmatter（---で囲まれたYAMLブロック）を除去
  markdown = markdown.replace(/^---\n[\s\S]*?\n---\n/, "");

  let html = await marked(markdown);

  // 相対パスの画像を絶対URLに変換（microCMSリッチエディタで表示するため）
  html = html.replace(/src="\/images\//g, `src="${SITE_URL}/images/`);

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

    // カテゴリ検証: microCMSスキーマに未登録のカテゴリ値は無視される
    if (article.category) {
      const verifyUrl = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/articles/${data.id}?fields=category`;
      const verifyRes = await fetch(verifyUrl, {
        headers: { "X-MICROCMS-API-KEY": WRITE_KEY },
      });
      if (verifyRes.ok) {
        const verifyData = await verifyRes.json();
        const savedCategory = verifyData.category ?? [];
        if (savedCategory.length === 0) {
          console.warn(`    ⚠️ カテゴリ警告: "${article.slug}" の category "${article.category}" がmicroCMSに反映されていません。`);
          console.warn(`       microCMSスキーマに "${article.category}" を追加してから fix-beginner-category.mjs を実行してください。`);
        }
      }
    }
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
