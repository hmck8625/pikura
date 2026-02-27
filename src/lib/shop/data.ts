import type { Product, ProductCategory } from "./types";
export type { Product, ProductCategory } from "./types";
export {
  PRODUCT_CATEGORY_LABELS,
  DEFAULT_SHOP_FILTERS,
} from "./types";

const PRODUCTS: Product[] = [
  // ===== あるあるネタ系 =====
  {
    id: "tshirt-001",
    slug: "stay-out-of-the-kitchen",
    name: "STAY OUT OF THE KITCHEN!",
    nameEn: "Stay Out of the Kitchen",
    description:
      "ボレーに夢中でキッチンに入っちゃう、あの瞬間。警告標識風のスポーティなデザインで「入るな！」を主張。",
    category: "humor",
    price: 4000,
    designText: "STAY OUT OF THE KITCHEN!",
    designConcept:
      "ノンボレーゾーン（キッチン）侵入あるある。警告標識のような洗練されたスポーツロゴデザイン。",
    imagePath: "/images/shop/stay-out-of-the-kitchen.png",
    purchaseUrl: "https://pikura.official.ec/items/136976712",
    tags: ["キッチン", "あるある", "ルール", "ボレー", "kitchen"],
    published: true,
  },
  {
    id: "tshirt-002",
    slug: "my-partners-fault",
    name: "IT'S MY PARTNER'S FAULT.",
    nameEn: "It's My Partner's Fault",
    description:
      "自分のミスは棚に上げ、パートナーがミスすると無言で圧をかける…ダブルスあるあるの極み。",
    category: "humor",
    price: 4000,
    designText: "IT'S MY PARTNER'S FAULT.",
    designConcept:
      "ミニマルなタイポグラフィと、隣を指す矢印。ダブルス文化の核心を突くデザイン。",
    imagePath: "/images/shop/my-partners-fault.png",
    purchaseUrl: "https://pikura.official.ec/items/136976715",
    tags: ["パートナー", "ダブルス", "あるある", "他責", "doubles"],
    published: true,
  },
  {
    id: "tshirt-003",
    slug: "ball-on",
    name: "LET! BALL ON!",
    nameEn: "Let Ball On",
    description:
      "白熱したラリー中に隣コートからボールが転がり込んでくる、あの独特の空気感。",
    category: "humor",
    price: 4000,
    designText: "LET! BALL ON!",
    designConcept:
      "激しいラリーのイラストに、警報のような緊急性の高いフォント。中断の瞬間を切り取る。",
    imagePath: "/images/shop/ball-on.png",
    purchaseUrl: "https://pikura.official.ec/items/136976716",
    tags: ["ボールオン", "レット", "あるある", "ラリー", "let"],
    published: true,
  },
  {
    id: "tshirt-004",
    slug: "dont-interrupt-my-dink",
    name: "Don't interrupt my dink.",
    nameEn: "Don't Interrupt My Dink",
    description:
      "ディンク練習中に隣コートのボールと空中衝突。真剣な練習を邪魔しないで。",
    category: "humor",
    price: 4000,
    designText: "Don't interrupt my dink.",
    designConcept:
      "2本のパドルと2個のボールが空中衝突して火花が散る、ダイナミックなイラスト。",
    imagePath: "/images/shop/dont-interrupt-my-dink.png",
    purchaseUrl: "https://pikura.official.ec/items/136976721",
    tags: ["ディンク", "あるある", "練習", "dink"],
    published: true,
  },
  {
    id: "tshirt-005",
    slug: "zero-zero-start",
    name: "0-0-START",
    nameEn: "Zero Zero Start",
    description:
      "ピックルボールのスコアコールの始まり。この3つの数字を聞くとアドレナリンが出る。",
    category: "humor",
    price: 4000,
    designText: "0-0-START",
    designConcept:
      "大きなスポーツフォントで0-0-START。スコアボード風のクリーンなデザイン。",
    imagePath: "/images/shop/zero-zero-start.png",
    purchaseUrl: "https://pikura.official.ec/items/136976723",
    tags: ["スコア", "サーブ", "開始", "score", "serve"],
    published: true,
  },
  {
    id: "tshirt-006",
    slug: "third-shot-drop-expert",
    name: "Third Shot Drop Expert*",
    nameEn: "Third Shot Drop Expert",
    description:
      "「*自称」の小さな注釈付き。3rdショットドロップが得意だと思い込んでいるあなたへ。",
    category: "humor",
    price: 4000,
    designText: "Third Shot Drop Expert*\n*self-proclaimed",
    designConcept:
      "自信満々のメインテキストに、小さなアスタリスク注釈。自虐ユーモア。",
    imagePath: "/images/shop/third-shot-drop-expert.png",
    purchaseUrl: "https://pikura.official.ec/items/136976725",
    tags: ["3rdショット", "ドロップ", "あるある", "自称", "third shot"],
    published: true,
  },
  {
    id: "tshirt-007",
    slug: "kitchen-police",
    name: "KITCHEN POLICE",
    nameEn: "Kitchen Police",
    description:
      "キッチン違反を見逃さない正義の味方。コート上のルール番人を自認するあなたに。",
    category: "humor",
    price: 4000,
    designText: "KITCHEN POLICE",
    designConcept:
      "警察バッジ風のエンブレムデザイン。「キッチン違反取締課」のユーモア。",
    imagePath: "/images/shop/kitchen-police.png",
    purchaseUrl: "https://pikura.official.ec/items/136976727",
    tags: ["キッチン", "ルール", "警察", "あるある", "police"],
    published: true,
  },
  {
    id: "tshirt-008",
    slug: "dink-responsibly",
    name: "DINK RESPONSIBLY",
    nameEn: "Dink Responsibly",
    description:
      "「責任あるディンクを」— ビールの警告文風のウィットに富んだデザイン。",
    category: "humor",
    price: 4000,
    designText: "DINK RESPONSIBLY",
    designConcept:
      "アルコール警告ラベル風のレトロデザイン。ウィットに富んだダブルミーニング。",
    imagePath: "/images/shop/dink-responsibly.png",
    purchaseUrl: "https://pikura.official.ec/items/136976731",
    tags: ["ディンク", "ユーモア", "レトロ", "dink"],
    published: true,
  },
  {
    id: "tshirt-009",
    slug: "came-for-exercise",
    name: "I came for the exercise, stayed for the drama",
    nameEn: "Came for Exercise Stayed for Drama",
    description:
      "運動のつもりで始めたのに、気づいたらコート上のドラマに夢中。ピックルボールの社交性を表現。",
    category: "humor",
    price: 4000,
    designText: "I came for the exercise,\nstayed for the drama.",
    designConcept:
      "エレガントな筆記体とサンセリフの組み合わせ。共感度の高いライフスタイル系。",
    imagePath: "/images/shop/came-for-exercise.png",
    purchaseUrl: "https://pikura.official.ec/items/136976734",
    tags: ["ライフスタイル", "ソーシャル", "あるある", "exercise"],
    published: true,
  },
  {
    id: "tshirt-010",
    slug: "dupr-doesnt-define-me",
    name: "My DUPR doesn't define me",
    nameEn: "My DUPR Doesn't Define Me",
    description:
      "レーティングに一喜一憂する日々。でも大事なのは楽しむこと…たぶん。",
    category: "humor",
    price: 4000,
    designText: "My DUPR doesn't define me.\n(...but what is it though?)",
    designConcept:
      "上段は堂々としたフォント、下段は小さなイタリック。レーティング不安あるある。",
    imagePath: "/images/shop/dupr-doesnt-define-me.png",
    purchaseUrl: "https://pikura.official.ec/items/136976736",
    tags: ["DUPR", "レーティング", "あるある", "rating"],
    published: true,
  },

  // ===== スタイリッシュ英語系 =====
  {
    id: "tshirt-011",
    slug: "dink-or-die",
    name: "DINK OR DIE",
    nameEn: "Dink or Die",
    description:
      "ディンクするか、死ぬか。ネット際の攻防を制するプレイヤーのための一着。",
    category: "stylish",
    price: 4000,
    designText: "DINK OR DIE",
    designConcept:
      "ボールドなサンセリフ体。黒地に白、または白地に黒のハイコントラスト。ストリート系。",
    imagePath: "/images/shop/dink-or-die.png",
    purchaseUrl: "https://pikura.official.ec/items/136976740",
    tags: ["ディンク", "ストリート", "クール", "dink"],
    published: true,
  },
  {
    id: "tshirt-012",
    slug: "kitchen-certified",
    name: "KITCHEN CERTIFIED",
    nameEn: "Kitchen Certified",
    description:
      "キッチンを制する者がゲームを制す。認定バッジ風の誇り高いデザイン。",
    category: "stylish",
    price: 4000,
    designText: "KITCHEN CERTIFIED",
    designConcept:
      "認定バッジ・スタンプ風のサークルデザイン。EST. 2026の年号入り。",
    imagePath: "/images/shop/kitchen-certified.png",
    purchaseUrl: "https://pikura.official.ec/items/136976742",
    tags: ["キッチン", "認定", "バッジ", "certified"],
    published: true,
  },
  {
    id: "tshirt-013",
    slug: "net-game-no-mercy",
    name: "NET GAME. NO MERCY.",
    nameEn: "Net Game No Mercy",
    description:
      "ネット際の攻防に容赦なし。アグレッシブなプレースタイルを宣言するデザイン。",
    category: "stylish",
    price: 4000,
    designText: "NET GAME.\nNO MERCY.",
    designConcept:
      "ミリタリー風のステンシルフォント。力強く、競技的なイメージ。",
    imagePath: "/images/shop/net-game-no-mercy.png",
    purchaseUrl: "https://pikura.official.ec/items/136976744",
    tags: ["ネット", "アグレッシブ", "競技", "net game"],
    published: true,
  },
  {
    id: "tshirt-014",
    slug: "eat-sleep-dink-repeat",
    name: "EAT. SLEEP. DINK. REPEAT.",
    nameEn: "Eat Sleep Dink Repeat",
    description:
      "食べて、寝て、ディンクして、繰り返す。ピックルボール漬けのライフスタイル。",
    category: "stylish",
    price: 4000,
    designText: "EAT. SLEEP.\nDINK. REPEAT.",
    designConcept:
      "等幅フォントで縦に並べた4アクション。ミニマルでモダン。",
    imagePath: "/images/shop/eat-sleep-dink-repeat.png",
    purchaseUrl: "https://pikura.official.ec/items/136976747",
    tags: ["ライフスタイル", "ディンク", "ミニマル", "lifestyle"],
    published: true,
  },
  {
    id: "tshirt-015",
    slug: "drop-it-like-its-hot",
    name: "DROP IT LIKE IT'S HOT",
    nameEn: "Drop It Like Its Hot",
    description:
      "Snoop Doggの名曲をピックルボール流に。サードショットドロップを決める瞬間。",
    category: "stylish",
    price: 4000,
    designText: "DROP IT\nLIKE IT'S HOT",
    designConcept:
      "レトロヒップホップ風のグラフィティフォント。ポップカルチャーとスポーツの融合。",
    imagePath: "/images/shop/drop-it-like-its-hot.png",
    purchaseUrl: "https://pikura.official.ec/items/136976749",
    tags: ["ドロップ", "ヒップホップ", "ポップ", "drop shot"],
    published: true,
  },

  // ===== 日本語デザイン系 =====
  {
    id: "tshirt-016",
    slug: "kitchen-haittemasen",
    name: "キッチン入ってないです",
    nameEn: "I Didn't Enter the Kitchen",
    description:
      "明らかに入ってるのにしらばっくれる名言。日本のピックルボールコートで最も聞く言い訳。",
    category: "japanese",
    price: 4000,
    designText: "キッチン\n入ってないです",
    designConcept:
      "手書き風の日本語フォントで真顔の否認。背景にキッチンラインのイラスト。",
    imagePath: "/images/shop/kitchen-haittemasen.png",
    purchaseUrl: "https://pikura.official.ec/items/136976750",
    tags: ["キッチン", "日本語", "あるある", "言い訳"],
    published: true,
  },
  {
    id: "tshirt-017",
    slug: "dink-shugyochu",
    name: "ディンク修行中",
    nameEn: "Dink Training in Progress",
    description:
      "まだまだ未熟だけど、日々精進。ディンクの道は長い。修行僧のように黙々と。",
    category: "japanese",
    price: 4000,
    designText: "ディンク修行中",
    designConcept:
      "書道風の力強い筆文字。和風×スポーツのクロスオーバー。",
    imagePath: "/images/shop/dink-shugyochu.png",
    purchaseUrl: "https://pikura.official.ec/items/136976754",
    tags: ["ディンク", "修行", "日本語", "和風"],
    published: true,
  },
  {
    id: "tshirt-018",
    slug: "partner-boshuchu",
    name: "パートナー募集中",
    nameEn: "Looking for Partner",
    description:
      "大会に出たいけどペアがいない。このTシャツを着てコートに行けば話しかけてもらえるかも。",
    category: "japanese",
    price: 4000,
    designText: "パートナー\n募集中",
    designConcept:
      "求人広告風のレトロポスターデザイン。実用性もあるユーモア。",
    imagePath: "/images/shop/partner-boshuchu.png",
    purchaseUrl: "https://pikura.official.ec/items/136976759",
    tags: ["パートナー", "募集", "ダブルス", "日本語"],
    published: true,
  },
  {
    id: "tshirt-019",
    slug: "pickler-desu",
    name: "ピクラーです。",
    nameEn: "I'm a Pickler",
    description:
      "シンプルに宣言。「ピクラー」= ピックルボーラーの日本語愛称。",
    category: "japanese",
    price: 4000,
    designText: "ピクラーです。",
    designConcept:
      "シンプルなゴシック体。ステートメント系のミニマルデザイン。",
    imagePath: "/images/shop/pickler-desu.png",
    purchaseUrl: "https://pikura.official.ec/items/136976762",
    tags: ["ピクラー", "アイデンティティ", "日本語", "シンプル"],
    published: true,
  },
  {
    id: "tshirt-020",
    slug: "kyo-mo-pickle",
    name: "今日もピクる。",
    nameEn: "Pickling Again Today",
    description:
      "「ピクる」= ピックルボールをする、の造語動詞。毎日ピクりたい人のための一着。",
    category: "japanese",
    price: 4000,
    designText: "今日もピクる。",
    designConcept:
      "カジュアルな丸ゴシック。日常感のある親しみやすいデザイン。",
    imagePath: "/images/shop/kyo-mo-pickle.png",
    purchaseUrl: "https://pikura.official.ec/items/136976765",
    tags: ["ピクる", "日常", "日本語", "カジュアル"],
    published: true,
  },

  // ===== イラスト・アート系 =====
  {
    id: "tshirt-021",
    slug: "minimal-paddle",
    name: "ミニマルパドル",
    nameEn: "Minimal Paddle",
    description:
      "パドルのシルエットだけで伝わる、ピックルボーラーの証。洗練されたミニマルアート。",
    category: "design",
    price: 4000,
    designText: "",
    designConcept:
      "パドルとボールの幾何学的シルエット。単色。ミニマルアート。",
    imagePath: "/images/shop/minimal-paddle.png",
    purchaseUrl: "https://pikura.official.ec/items/136976767",
    tags: ["パドル", "ミニマル", "アート", "シルエット"],
    published: true,
  },
  {
    id: "tshirt-022",
    slug: "court-blueprint",
    name: "コートブループリント",
    nameEn: "Court Blueprint",
    description:
      "ピックルボールコートの設計図。建築図面風のインテリジェントなデザイン。",
    category: "design",
    price: 4000,
    designText: "",
    designConcept:
      "青写真（ブループリント）風のコート図面。寸法線、注釈付き。エンジニア心をくすぐる。",
    imagePath: "/images/shop/court-blueprint.png",
    purchaseUrl: "https://pikura.official.ec/items/136976770",
    tags: ["コート", "設計図", "ブループリント", "アート"],
    published: true,
  },
  {
    id: "tshirt-023",
    slug: "japanese-wave-pickle",
    name: "浮世絵ピックルボール",
    nameEn: "Ukiyo-e Pickleball",
    description:
      "葛飾北斎の大波にピックルボールが乗る。和風×ピックルボールのアートフュージョン。",
    category: "design",
    price: 4000,
    designText: "",
    designConcept:
      "浮世絵スタイルの大波にピックルボールが浮かぶ。ジャパニーズポップアート。",
    imagePath: "/images/shop/japanese-wave-pickle.png",
    purchaseUrl: "https://pikura.official.ec/items/136976771",
    tags: ["浮世絵", "和風", "アート", "北斎", "ukiyo-e"],
    published: true,
  },
  {
    id: "tshirt-024",
    slug: "neon-pickle",
    name: "ネオンピックル",
    nameEn: "Neon Pickle",
    description:
      "夜のネオンサイン風。バーの看板のようなレトロフューチャーなピックルボールデザイン。",
    category: "design",
    price: 4000,
    designText: "PICKLE",
    designConcept:
      "ネオンサイン風のグロー効果。パドルとボールのアイコン。暗い背景に映える。",
    imagePath: "/images/shop/neon-pickle.png",
    purchaseUrl: "https://pikura.official.ec/items/136976772",
    tags: ["ネオン", "レトロ", "アート", "neon"],
    published: true,
  },
  {
    id: "tshirt-025",
    slug: "pikura-original",
    name: "PIKURA ORIGINAL",
    nameEn: "Pikura Original",
    description:
      "pikura.appオリジナルブランドTシャツ。シンプルなロゴデザインでピックルボール愛を表現。",
    category: "brand",
    price: 4000,
    designText: "PIKURA",
    designConcept:
      "pikuraロゴをメインに配置。ブランドカラー（スカイブルー）のアクセント。",
    imagePath: "/images/shop/pikura-original.png",
    purchaseUrl: "https://pikura.official.ec/items/136976773",
    tags: ["ピクラ", "ブランド", "オリジナル", "ロゴ"],
    published: true,
  },
];

// --- ユーティリティ関数 ---

export function getProducts(): Product[] {
  return PRODUCTS.filter((p) => p.published);
}

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug && p.published);
}

export function getProductsByCategory(category: ProductCategory): Product[] {
  return PRODUCTS.filter((p) => p.category === category && p.published);
}

export function getAllProductSlugs(): string[] {
  return PRODUCTS.filter((p) => p.published).map((p) => p.slug);
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase();
  return PRODUCTS.filter(
    (p) =>
      p.published &&
      (p.name.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.description.includes(q) ||
        p.designText.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))),
  );
}
