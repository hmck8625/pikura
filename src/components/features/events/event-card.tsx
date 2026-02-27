"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PickleballEvent } from "@/lib/events/types";
import {
  EVENT_CATEGORY_LABELS,
  EVENT_LEVEL_LABELS,
  EVENT_SOURCE_LABELS,
  REGISTRATION_STATUS_LABELS,
} from "@/lib/events/types";

function formatDate(dateString: string | null): string {
  if (!dateString) return "日程未定";
  return new Date(dateString).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getDaysUntil(dateString: string | null): string | null {
  if (!dateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(dateString);
  eventDate.setHours(0, 0, 0, 0);
  const diff = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return null;
  if (diff === 0) return "今日";
  if (diff === 1) return "明日";
  if (diff <= 7) return `${diff}日後`;
  return null;
}

const SOURCE_COLORS: Record<string, string> = {
  jpa: "bg-blue-100 text-blue-800",
  tennisbear: "bg-green-100 text-green-800",
  pjf: "bg-orange-100 text-orange-800",
  manual: "bg-gray-100 text-gray-800",
};

const LEVEL_COLORS: Record<string, string> = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-yellow-100 text-yellow-800",
  advanced: "bg-red-100 text-red-800",
  open: "bg-blue-100 text-blue-800",
  unknown: "",
};

export function EventCard({ event }: { event: PickleballEvent }) {
  const countdown = getDaysUntil(event.eventDate);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="mb-2 flex flex-wrap gap-1.5">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SOURCE_COLORS[event.source] ?? ""}`}>
            {EVENT_SOURCE_LABELS[event.source]}
          </span>
          <Badge variant="outline">
            {EVENT_CATEGORY_LABELS[event.category]}
          </Badge>
          {event.prefecture && (
            <Badge variant="secondary">{event.prefecture}</Badge>
          )}
          {event.level !== "unknown" && (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${LEVEL_COLORS[event.level]}`}>
              {EVENT_LEVEL_LABELS[event.level]}
            </span>
          )}
          {event.duprReflected === true && (
            <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
              DUPR反映
            </span>
          )}
        </div>
        <CardTitle className="text-lg leading-snug">
          <Link
            href={`/events/${event.id}`}
            className="hover:underline"
          >
            {event.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="mt-auto space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>{formatDate(event.eventDate)}</span>
          {countdown && (
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
              {countdown}
            </span>
          )}
        </div>
        {event.location && <p className="truncate">{event.location}</p>}
        <div className="flex flex-wrap gap-2">
          {event.entryFee && (
            <span className="text-xs">{event.entryFee}</span>
          )}
          {event.registrationStatus !== "unknown" && (
            <span className={`text-xs font-medium ${event.registrationStatus === "open" ? "text-green-600" : "text-gray-400"}`}>
              {REGISTRATION_STATUS_LABELS[event.registrationStatus]}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
