import type { PickleballEvent, EventFilters } from "./types";

/** 月の開始日と終了日を取得 */
function getMonthRange(offset: number): { start: string; end: string } {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const start = target.toISOString().split("T")[0];
  const end = new Date(target.getFullYear(), target.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
  return { start, end };
}

/** フィルター適用（純粋関数） */
export function filterEvents(
  events: PickleballEvent[],
  filters: EventFilters
): PickleballEvent[] {
  const today = new Date().toISOString().split("T")[0];

  return events.filter((event) => {
    // カテゴリ
    if (filters.category !== "all" && event.category !== filters.category) {
      return false;
    }

    // レベル
    if (filters.level !== "all" && event.level !== filters.level) {
      return false;
    }

    // 都道府県
    if (filters.prefecture !== "all" && event.prefecture !== filters.prefecture) {
      return false;
    }

    // 日付範囲
    if (filters.dateRange !== "all" && event.eventDate) {
      switch (filters.dateRange) {
        case "this-month": {
          const { start, end } = getMonthRange(0);
          if (event.eventDate < start || event.eventDate > end) return false;
          break;
        }
        case "next-month": {
          const { start, end } = getMonthRange(1);
          if (event.eventDate < start || event.eventDate > end) return false;
          break;
        }
        case "3-months": {
          const threeMonthsLater = new Date();
          threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
          const end = threeMonthsLater.toISOString().split("T")[0];
          if (event.eventDate < today || event.eventDate > end) return false;
          break;
        }
        case "past": {
          if (event.eventDate >= today) return false;
          break;
        }
      }
    } else if (filters.dateRange === "past" && !event.eventDate) {
      return false;
    }

    // DUPR
    if (filters.dupr === "yes" && event.duprReflected !== true) {
      return false;
    }
    if (filters.dupr === "no" && event.duprReflected !== false) {
      return false;
    }

    // 形式
    if (filters.format !== "all" && !event.format.includes(filters.format)) {
      return false;
    }

    // ソース
    if (filters.source !== "all" && event.source !== filters.source) {
      return false;
    }

    // テキスト検索
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const searchTarget = `${event.title} ${event.description} ${event.location ?? ""} ${event.prefecture ?? ""}`.toLowerCase();
      if (!searchTarget.includes(q)) {
        return false;
      }
    }

    return true;
  });
}

/** イベントを日付順にソート（未来→日付なし→過去の順） */
export function sortEventsByDate(events: PickleballEvent[]): PickleballEvent[] {
  const today = new Date().toISOString().split("T")[0];
  return [...events].sort((a, b) => {
    // 日付なしは後ろ
    if (!a.eventDate && !b.eventDate) return 0;
    if (!a.eventDate) return 1;
    if (!b.eventDate) return -1;

    const aFuture = a.eventDate >= today;
    const bFuture = b.eventDate >= today;

    // 未来イベントが先
    if (aFuture && !bFuture) return -1;
    if (!aFuture && bFuture) return 1;

    // 未来同士は日付が近い順、過去同士は新しい順
    if (aFuture) return a.eventDate.localeCompare(b.eventDate);
    return b.eventDate.localeCompare(a.eventDate);
  });
}
