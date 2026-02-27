"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { EventFilters, EventCategory, EventLevel, EventFormat, EventSource } from "@/lib/events/types";
import {
  EVENT_CATEGORY_LABELS,
  EVENT_LEVEL_LABELS,
  EVENT_FORMAT_LABELS,
  EVENT_SOURCE_LABELS,
  PREFECTURES,
  DEFAULT_FILTERS,
} from "@/lib/events/types";

type EventFiltersBarProps = {
  filters: EventFilters;
  onFiltersChange: (filters: EventFilters) => void;
  totalCount: number;
  filteredCount: number;
};

export function EventFiltersBar({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
}: EventFiltersBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = (partial: Partial<EventFilters>) => {
    onFiltersChange({ ...filters, ...partial });
  };

  const hasActiveFilters = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  const activeFilterCount = [
    filters.category !== "all",
    filters.level !== "all",
    filters.prefecture !== "all",
    filters.dateRange !== "all",
    filters.dupr !== "all",
    filters.format !== "all",
    filters.source !== "all",
    filters.search !== "",
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* 日付ボタン */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "すべて"],
            ["this-month", "今月"],
            ["next-month", "来月"],
            ["3-months", "3ヶ月以内"],
            ["past", "過去"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            variant={filters.dateRange === value ? "default" : "outline"}
            size="sm"
            onClick={() => update({ dateRange: value })}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* カテゴリピル */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filters.category === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => update({ category: "all" })}
        >
          すべて
        </Button>
        {(Object.entries(EVENT_CATEGORY_LABELS) as [EventCategory, string][]).map(
          ([key, label]) => (
            <Button
              key={key}
              variant={filters.category === key ? "default" : "outline"}
              size="sm"
              onClick={() => update({ category: key })}
            >
              {label}
            </Button>
          )
        )}
      </div>

      {/* テキスト検索 */}
      <Input
        placeholder="イベント名・場所で検索..."
        value={filters.search}
        onChange={(e) => update({ search: e.target.value })}
        className="max-w-sm"
      />

      {/* 詳細フィルター展開ボタン */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced((v) => !v)}
        >
          {showAdvanced ? "詳細フィルターを閉じる" : "詳細フィルター"}
          {activeFilterCount > 0 && !showAdvanced && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => onFiltersChange(DEFAULT_FILTERS)}
          >
            フィルターをクリア
          </Button>
        )}
      </div>

      {/* 詳細フィルター */}
      {showAdvanced && (
        <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* レベル */}
          <div>
            <p className="mb-2 text-sm font-medium">レベル</p>
            <div className="flex flex-wrap gap-1">
              <Button
                variant={filters.level === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => update({ level: "all" })}
              >
                すべて
              </Button>
              {(
                Object.entries(EVENT_LEVEL_LABELS).filter(([k]) => k !== "unknown") as [EventLevel, string][]
              ).map(([key, label]) => (
                <Button
                  key={key}
                  variant={filters.level === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => update({ level: key })}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* 都道府県 */}
          <div>
            <p className="mb-2 text-sm font-medium">都道府県</p>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={filters.prefecture}
              onChange={(e) => update({ prefecture: e.target.value })}
            >
              <option value="all">すべて</option>
              {PREFECTURES.map((pref) => (
                <option key={pref} value={pref}>
                  {pref}
                </option>
              ))}
            </select>
          </div>

          {/* DUPR */}
          <div>
            <p className="mb-2 text-sm font-medium">DUPR反映</p>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ["all", "すべて"],
                  ["yes", "反映あり"],
                  ["no", "なし"],
                ] as const
              ).map(([value, label]) => (
                <Button
                  key={value}
                  variant={filters.dupr === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => update({ dupr: value })}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* 形式 */}
          <div>
            <p className="mb-2 text-sm font-medium">形式</p>
            <div className="flex flex-wrap gap-1">
              <Button
                variant={filters.format === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => update({ format: "all" })}
              >
                すべて
              </Button>
              {(
                Object.entries(EVENT_FORMAT_LABELS).filter(([k]) => k !== "unknown") as [EventFormat, string][]
              ).map(([key, label]) => (
                <Button
                  key={key}
                  variant={filters.format === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => update({ format: key })}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* ソース */}
          <div>
            <p className="mb-2 text-sm font-medium">情報元</p>
            <div className="flex flex-wrap gap-1">
              <Button
                variant={filters.source === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => update({ source: "all" })}
              >
                すべて
              </Button>
              {(Object.entries(EVENT_SOURCE_LABELS) as [EventSource, string][]).map(
                ([key, label]) => (
                  <Button
                    key={key}
                    variant={filters.source === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => update({ source: key })}
                  >
                    {label}
                  </Button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* 結果カウント */}
      <p className="text-sm text-muted-foreground">
        {filteredCount === totalCount
          ? `${totalCount}件のイベント`
          : `${totalCount}件中 ${filteredCount}件を表示`}
      </p>
    </div>
  );
}
