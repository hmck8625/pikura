"use client";

import { Button } from "@/components/ui/button";

type EventViewToggleProps = {
  view: "list" | "map";
  onViewChange: (view: "list" | "map") => void;
};

export function EventViewToggle({ view, onViewChange }: EventViewToggleProps) {
  return (
    <div className="flex rounded-md border">
      <Button
        variant={view === "list" ? "default" : "ghost"}
        size="sm"
        className="rounded-r-none"
        onClick={() => onViewChange("list")}
      >
        リスト
      </Button>
      <Button
        variant={view === "map" ? "default" : "ghost"}
        size="sm"
        className="rounded-l-none"
        onClick={() => onViewChange("map")}
      >
        マップ
      </Button>
    </div>
  );
}
