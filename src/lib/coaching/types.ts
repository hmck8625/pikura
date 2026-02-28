export type CoachingType = "individual" | "group" | "clinic";
export type TargetLevel = "beginner" | "intermediate" | "advanced";
export type ContactMethod = "instagram" | "line" | "email" | "x";
export type Availability = "open" | "limited" | "closed";

export type CoachProfile = {
  slug: string;
  displayName: string;
  photoUrl: string | null;
  duprRating: number | null;
  achievements: string[];
  coachingTypes: CoachingType[];
  targetLevels: TargetLevel[];
  areas: string[];
  priceRange: string;
  description: string;
  contactMethod: ContactMethod;
  contactUrl: string;
  availability: Availability;
  playerSlug: string | null;
};

export const COACHING_TYPE_LABELS: Record<CoachingType, string> = {
  individual: "個人レッスン",
  group: "グループレッスン",
  clinic: "クリニック",
};

export const TARGET_LEVEL_LABELS: Record<TargetLevel, string> = {
  beginner: "初心者OK",
  intermediate: "中級者向け",
  advanced: "上級者向け",
};

export const CONTACT_METHOD_LABELS: Record<ContactMethod, string> = {
  instagram: "Instagram",
  line: "LINE",
  email: "メール",
  x: "X (Twitter)",
};

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  open: "募集中",
  limited: "残りわずか",
  closed: "現在募集停止中",
};
