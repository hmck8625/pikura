import type { CoachProfile, TargetLevel } from "./types";

/**
 * コーチングプロフィールデータ
 *
 * プロ選手からの承諾後、ここにプロフィールを追加する。
 * 初期はサンプルデータ（承諾済みの選手のみ掲載）。
 */
const COACHES: CoachProfile[] = [
  // モックプロフィール（打診時のイメージ共有用サンプル）
  {
    slug: "sample-coach",
    displayName: "サンプル太郎",
    photoUrl: null,
    duprRating: 5.234,
    achievements: [
      "JPA全日本選手権 ダブルス3位",
      "APP JAPAN Open 2026 出場",
      "元テニスインカレ出場",
    ],
    coachingTypes: ["individual", "group", "clinic"],
    targetLevels: ["beginner", "intermediate", "advanced"],
    areas: ["東京", "千葉", "埼玉"],
    priceRange: "¥5,000〜10,000/時間",
    description:
      "初心者から上級者まで、レベルに合わせた丁寧な指導を行います。\n\n【個人レッスン】\nマンツーマンで弱点を集中的に改善。ディンク、3rdショットドロップ、サーブなどテーマを絞った練習も可能です。\n\n【グループレッスン】\n2〜6名のグループで基礎〜ゲーム戦術まで。友人同士での参加も歓迎です。\n\n【クリニック】\n月1回、テーマ別のクリニックを開催中。初中級者の壁を突破するための実践的なプログラムです。\n\nピクラ経由でお申し込みいただくと、レッスン料が5%割引になります。",
    contactMethod: "instagram",
    contactUrl: "https://www.instagram.com/sample/",
    availability: "open",
    playerSlug: null,
  },
];

export function getCoaches(level?: TargetLevel, area?: string): CoachProfile[] {
  let result = COACHES.filter((c) => c.availability !== "closed");

  if (level) {
    result = result.filter((c) => c.targetLevels.includes(level));
  }

  if (area) {
    result = result.filter((c) =>
      c.areas.some((a) => a.includes(area))
    );
  }

  return result;
}

export function getAllCoaches(): CoachProfile[] {
  return COACHES;
}

export function getCoachBySlug(slug: string): CoachProfile | undefined {
  return COACHES.find((c) => c.slug === slug);
}

export function getAllCoachSlugs(): string[] {
  return COACHES.map((c) => c.slug);
}

export function getCoachCount(): number {
  return COACHES.length;
}

export function getActiveCoachCount(): number {
  return COACHES.filter((c) => c.availability !== "closed").length;
}

export function getAvailableAreas(): string[] {
  const areas = new Set<string>();
  for (const coach of COACHES) {
    for (const area of coach.areas) {
      areas.add(area);
    }
  }
  return Array.from(areas).sort();
}
