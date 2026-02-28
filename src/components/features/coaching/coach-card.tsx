"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CoachProfile } from "@/lib/coaching/types";
import {
  COACHING_TYPE_LABELS,
  TARGET_LEVEL_LABELS,
  AVAILABILITY_LABELS,
} from "@/lib/coaching/types";

const AVAILABILITY_COLORS: Record<string, string> = {
  open: "bg-green-100 text-green-800",
  limited: "bg-yellow-100 text-yellow-800",
  closed: "bg-gray-100 text-gray-500",
};

const LEVEL_COLORS: Record<string, string> = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-yellow-100 text-yellow-800",
  advanced: "bg-red-100 text-red-800",
};

export function CoachCard({ coach }: { coach: CoachProfile }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="mb-2 flex flex-wrap gap-1.5">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${AVAILABILITY_COLORS[coach.availability]}`}
          >
            {AVAILABILITY_LABELS[coach.availability]}
          </span>
          {coach.targetLevels.map((level) => (
            <span
              key={level}
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${LEVEL_COLORS[level]}`}
            >
              {TARGET_LEVEL_LABELS[level]}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Image
            src={coach.photoUrl ?? "/images/brand/default-avatar.png"}
            alt={coach.displayName}
            width={56}
            height={56}
            className="h-14 w-14 rounded-full object-cover"
          />
          <div>
            <CardTitle className="text-lg leading-snug">
              <Link
                href={`/coaching/${coach.slug}`}
                className="hover:underline"
              >
                {coach.displayName}
              </Link>
            </CardTitle>
            {coach.duprRating && (
              <p className="text-sm text-muted-foreground">
                DUPR {coach.duprRating.toFixed(3)}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="mt-auto space-y-3 text-sm text-muted-foreground">
        <div className="flex flex-wrap gap-1.5">
          {coach.coachingTypes.map((type) => (
            <Badge key={type} variant="outline">
              {COACHING_TYPE_LABELS[type]}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {coach.areas.map((area) => (
            <Badge key={area} variant="secondary">
              {area}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground">{coach.priceRange}</p>
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            ピクラ経由5%OFF
          </span>
        </div>
        {coach.achievements.length > 0 && (
          <p className="line-clamp-2 text-xs">
            {coach.achievements.join(" / ")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
