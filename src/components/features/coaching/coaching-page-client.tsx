"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { CoachCard } from "@/components/features/coaching/coach-card";
import type { CoachProfile, TargetLevel } from "@/lib/coaching/types";
import { TARGET_LEVEL_LABELS } from "@/lib/coaching/types";

type Props = {
  coaches: CoachProfile[];
  areas: string[];
};

const LEVEL_OPTIONS: { value: TargetLevel | "all"; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "beginner", label: TARGET_LEVEL_LABELS.beginner },
  { value: "intermediate", label: TARGET_LEVEL_LABELS.intermediate },
  { value: "advanced", label: TARGET_LEVEL_LABELS.advanced },
];

export function CoachingPageClient({ coaches, areas }: Props) {
  const [selectedLevel, setSelectedLevel] = useState<TargetLevel | "all">("all");
  const [selectedArea, setSelectedArea] = useState<string>("all");

  const filtered = useMemo(() => {
    let result = coaches;
    if (selectedLevel !== "all") {
      result = result.filter((c) => c.targetLevels.includes(selectedLevel));
    }
    if (selectedArea !== "all") {
      result = result.filter((c) =>
        c.areas.some((a) => a.includes(selectedArea))
      );
    }
    return result;
  }, [coaches, selectedLevel, selectedArea]);

  return (
    <div>
      {/* フィルター */}
      <div className="mb-6 space-y-4">
        {/* レベルフィルター */}
        <div className="flex flex-wrap gap-2">
          {LEVEL_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={selectedLevel === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedLevel(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {/* エリアフィルター */}
        {areas.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedArea === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedArea("all")}
            >
              全エリア
            </Button>
            {areas.map((area) => (
              <Button
                key={area}
                variant={selectedArea === area ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedArea(area)}
              >
                {area}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* 結果 */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <p className="text-lg font-medium">現在コーチ情報を準備中です</p>
          <p className="mt-2 text-sm">
            プロ選手への打診を進めています。近日中にコーチ情報が掲載されますので、しばらくお待ちください。
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((coach) => (
            <CoachCard key={coach.slug} coach={coach} />
          ))}
        </div>
      )}
    </div>
  );
}
