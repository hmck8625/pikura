"use client";

import { Button } from "@/components/ui/button";
import type { EventCategory } from "@/lib/events/data";
import { EVENT_CATEGORY_LABELS } from "@/lib/events/data";

type EventFiltersProps = {
  selected: EventCategory | "all";
  onSelect: (category: EventCategory | "all") => void;
  showPast: boolean;
  onTogglePast: () => void;
  pastCount: number;
};

export function EventFilters({
  selected,
  onSelect,
  showPast,
  onTogglePast,
  pastCount,
}: EventFiltersProps) {
  const categories: (EventCategory | "all")[] = [
    "all",
    "tournament",
    "experience",
    "certification",
    "workshop",
    "other",
  ];

  const labels: Record<string, string> = {
    all: "すべて",
    ...EVENT_CATEGORY_LABELS,
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selected === cat ? "default" : "outline"}
            size="sm"
            onClick={() => onSelect(cat)}
          >
            {labels[cat]}
          </Button>
        ))}
      </div>
      {pastCount > 0 && (
        <Button variant="ghost" size="sm" onClick={onTogglePast}>
          {showPast
            ? "過去のイベントを非表示"
            : `過去のイベントも表示 (${pastCount}件)`}
        </Button>
      )}
    </div>
  );
}
