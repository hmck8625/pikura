export type EventSource = "jpa" | "tennisbear" | "pjf" | "manual";
export type EventLevel = "beginner" | "intermediate" | "advanced" | "open" | "unknown";
export type EventFormat = "singles" | "doubles" | "mixed" | "unknown";
export type RegistrationStatus = "open" | "closed" | "unknown";
export type EventCategory = "tournament" | "experience" | "workshop" | "certification" | "other";

export type PickleballEvent = {
  id: string;
  title: string;
  description: string;
  eventDate: string | null;
  location: string | null;
  prefecture: string | null;
  category: EventCategory;
  sourceUrl: string;
  source: EventSource;
  publishedAt: string;
  fetchedAt: string;

  // 選手が気にする情報
  level: EventLevel;
  duprReflected: boolean | null;
  entryFee: string | null;
  format: EventFormat[];
  registrationStatus: RegistrationStatus;
  registrationUrl: string | null;
  maxParticipants: number | null;
  currentParticipants: number | null;
  eventEndDate: string | null;

  // 地図用
  latitude: number | null;
  longitude: number | null;

  // ソース追跡
  sourceEventId: string | null;
};

export type EventFilters = {
  category: EventCategory | "all";
  level: EventLevel | "all";
  prefecture: string | "all";
  dateRange: "this-month" | "next-month" | "3-months" | "past" | "all";
  dupr: "yes" | "no" | "all";
  format: EventFormat | "all";
  source: EventSource | "all";
  search: string;
};

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  tournament: "大会",
  experience: "体験会・交流会",
  workshop: "イベント",
  certification: "資格講習会",
  other: "その他",
};

export const EVENT_LEVEL_LABELS: Record<EventLevel, string> = {
  beginner: "初級",
  intermediate: "中級",
  advanced: "上級",
  open: "オープン",
  unknown: "不明",
};

export const EVENT_FORMAT_LABELS: Record<EventFormat, string> = {
  singles: "シングルス",
  doubles: "ダブルス",
  mixed: "ミックス",
  unknown: "不明",
};

export const EVENT_SOURCE_LABELS: Record<EventSource, string> = {
  jpa: "JPA",
  tennisbear: "テニスベア",
  pjf: "PJF",
  manual: "手動登録",
};

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  open: "募集中",
  closed: "募集終了",
  unknown: "不明",
};

export const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
] as const;

export const DEFAULT_FILTERS: EventFilters = {
  category: "all",
  level: "all",
  prefecture: "all",
  dateRange: "all",
  dupr: "all",
  format: "all",
  source: "all",
  search: "",
};
