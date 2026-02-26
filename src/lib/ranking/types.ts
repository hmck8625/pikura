// JPA公式ランキングのエントリ（CSVの1行に対応）
export type JpaRankingEntry = {
  category: string;
  ageGroup: string;
  rank: number;
  playerName: string;
  points: number;
  period: string;
};

// カテゴリ定義
export const CATEGORIES = [
  "男子シングルス",
  "男子ダブルス",
  "女子シングルス",
  "女子ダブルス",
  "混合ダブルス(男性)",
  "混合ダブルス(女性)",
] as const;

export type Category = (typeof CATEGORIES)[number];

// 年齢グループ定義
export const AGE_GROUPS = ["19+", "35+", "50+"] as const;

export type AgeGroup = (typeof AGE_GROUPS)[number];

// カテゴリの表示名
export const CATEGORY_LABELS: Record<string, string> = {
  "男子シングルス": "男子シングルス",
  "男子ダブルス": "男子ダブルス",
  "女子シングルス": "女子シングルス",
  "女子ダブルス": "女子ダブルス",
  "混合ダブルス(男性)": "混合ダブルス(男)",
  "混合ダブルス(女性)": "混合ダブルス(女)",
};

// 年齢グループの表示名
export const AGE_GROUP_LABELS: Record<string, string> = {
  "19+": "一般",
  "35+": "35歳以上",
  "50+": "50歳以上",
};

// 選手サマリー（選手詳細ページ用）
export type PlayerSummary = {
  slug: string;
  name: string;
  rankings: {
    category: string;
    ageGroup: string;
    rank: number;
    points: number;
  }[];
  totalPoints: number;
  bestRank: number;
  bestCategory: string;
  bestAgeGroup: string;
};
