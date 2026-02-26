"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  CATEGORIES,
  AGE_GROUPS,
  CATEGORY_LABELS,
  AGE_GROUP_LABELS,
} from "@/lib/ranking/types";

export function RankingCategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") ?? "男子シングルス";
  const currentAgeGroup = searchParams.get("age") ?? "19+";

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, value);
      router.push(`/rankings?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-4">
      {/* カテゴリ選択 */}
      <div>
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          カテゴリ
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={currentCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => updateParams("category", cat)}
            >
              {CATEGORY_LABELS[cat]}
            </Button>
          ))}
        </div>
      </div>

      {/* 年齢グループ選択 */}
      <div>
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          年齢区分
        </p>
        <div className="flex flex-wrap gap-2">
          {AGE_GROUPS.map((ag) => (
            <Button
              key={ag}
              variant={currentAgeGroup === ag ? "default" : "outline"}
              size="sm"
              onClick={() => updateParams("age", ag)}
            >
              {AGE_GROUP_LABELS[ag]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
