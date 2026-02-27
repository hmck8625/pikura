import type { Product } from "@/components/features/articles/product-card";

// Amazonアソシエイトのタグ（環境変数 or ハードコード）
// .env.local に NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG=pikura-22 を設定してください
const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG ?? "pikura-22";

function amazonUrl(asin: string): string {
  return `https://www.amazon.co.jp/dp/${asin}?tag=${AMAZON_TAG}`;
}

// 記事スラッグ → おすすめ商品リスト
const productsBySlug: Record<string, Product[]> = {
  "paddle-guide": [
    {
      name: "JOOLA Ben Johns Hyperion CFS 16",
      description:
        "世界ランキング1位Ben Johns使用モデル。カーボンフェイス搭載でスピン性能抜群。中〜上級者向け。",
      price: "¥29,800",
      affiliateUrl: amazonUrl("B0CXXXXXX1"),
      store: "amazon",
      badge: "人気No.1",
    },
    {
      name: "Selkirk VANGUARD Power Air Invikta",
      description:
        "ProSpin+テクスチャーで強力なスピンを実現。軽量で操作性が高く、ダブルスに最適。",
      price: "¥26,800",
      affiliateUrl: amazonUrl("B0CXXXXXX2"),
      store: "amazon",
    },
    {
      name: "Franklin Ben Johns Signature",
      description:
        "コスパ最強の入門パドル。13mmコア厚でコントロール重視。初心者〜中級者におすすめ。",
      price: "¥8,980",
      affiliateUrl: amazonUrl("B0CXXXXXX3"),
      store: "amazon",
      badge: "初心者向け",
    },
  ],
  "shoes-guide": [
    {
      name: "ミズノ ウエーブファングPRO",
      description:
        "インドアコート最適。ミズノウェーブで安定性抜群。日本人の足型にフィット。",
      price: "¥12,100",
      affiliateUrl: amazonUrl("B0CXXXXXX4"),
      store: "amazon",
      badge: "インドア人気",
    },
    {
      name: "アシックス GEL-RESOLUTION 9",
      description:
        "アウトドアコート向け。GELクッションで膝に優しい。耐久性の高いアウトソール。",
      price: "¥15,400",
      affiliateUrl: amazonUrl("B0CXXXXXX5"),
      store: "amazon",
    },
    {
      name: "ヨネックス パワークッション65Z3",
      description:
        "軽量パワークッション搭載。素早い切り返しに対応。バドミントン経験者にも人気。",
      price: "¥13,200",
      affiliateUrl: amazonUrl("B0CXXXXXX6"),
      store: "amazon",
    },
  ],
  "how-to-start-pickleball": [
    {
      name: "Franklin ピックルボール スターターセット",
      description:
        "パドル2本+ボール4個のセット。初めてのピックルボールに必要な道具が揃う。",
      price: "¥6,980",
      affiliateUrl: amazonUrl("B0CXXXXXX7"),
      store: "amazon",
      badge: "入門セット",
    },
    {
      name: "Onix Pure 2 アウトドアボール (6個入)",
      description:
        "USA Pickleball公認球。大会でも使用される定番ボール。耐久性も◎。",
      price: "¥3,480",
      affiliateUrl: amazonUrl("B0CXXXXXX8"),
      store: "amazon",
    },
  ],
  "court-size-setup": [
    {
      name: "ポータブル ピックルボールネット セット",
      description:
        "公式サイズ対応。組み立て5分。キャリーバッグ付きで持ち運び簡単。",
      price: "¥12,800",
      affiliateUrl: amazonUrl("B0CXXXXXX9"),
      store: "amazon",
      badge: "おすすめ",
    },
    {
      name: "コートライン テープ（ピックルボール用）",
      description:
        "体育館や駐車場にコートラインを引けるテープ。貼って剥がせるタイプ。",
      price: "¥2,480",
      affiliateUrl: amazonUrl("B0CXXXXXXA"),
      store: "amazon",
    },
  ],
  "paddle-shop-guide": [
    {
      name: "JOOLA Ben Johns Hyperion CFS 16",
      description:
        "世界ランキング1位Ben Johns使用モデル。カーボンフェイス搭載でスピン性能抜群。中〜上級者向け。",
      price: "¥29,800",
      affiliateUrl: amazonUrl("B0CXXXXXX1"),
      store: "amazon",
      badge: "人気No.1",
    },
    {
      name: "Franklin Ben Johns Signature",
      description:
        "コスパ最強の入門パドル。13mmコア厚でコントロール重視。初心者〜中級者におすすめ。",
      price: "¥8,980",
      affiliateUrl: amazonUrl("B0CXXXXXX3"),
      store: "amazon",
      badge: "初心者向け",
    },
    {
      name: "ヨネックス VCORE PB",
      description:
        "テニスラケットの技術をピックルボールに応用。日本メーカーならではの品質と操作性。",
      price: "¥19,800",
      affiliateUrl: amazonUrl("B0CXXXXXXB"),
      store: "amazon",
      badge: "国産",
    },
  ],
};

export function getProductsForArticle(slug: string): Product[] {
  return productsBySlug[slug] ?? [];
}

export function getProductSectionTitle(slug: string): string {
  const titles: Record<string, string> = {
    "paddle-guide": "おすすめパドル",
    "shoes-guide": "おすすめシューズ",
    "how-to-start-pickleball": "入門に必要な道具",
    "court-size-setup": "コート設営に必要なアイテム",
    "paddle-shop-guide": "おすすめパドル",
  };
  return titles[slug] ?? "おすすめアイテム";
}
