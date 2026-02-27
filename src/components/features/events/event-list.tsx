"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EventFilters } from "./event-filters";
import type { JpaEvent, EventCategory } from "@/lib/events/data";
import { EVENT_CATEGORY_LABELS } from "@/lib/events/data";

type EventListProps = {
  upcomingEvents: JpaEvent[];
  pastEvents: JpaEvent[];
};

function formatDate(dateString: string | null): string {
  if (!dateString) return "日程未定";
  return new Date(dateString).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function EventCard({ event }: { event: JpaEvent }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="mb-2 flex flex-wrap gap-2">
          <Badge variant="outline">
            {EVENT_CATEGORY_LABELS[event.category]}
          </Badge>
          {event.prefecture && (
            <Badge variant="secondary">{event.prefecture}</Badge>
          )}
        </div>
        <CardTitle className="text-lg">
          <Link
            href={`/events/${event.id}`}
            className="hover:underline"
          >
            {event.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="mt-auto space-y-2 text-sm text-muted-foreground">
        <p>{formatDate(event.eventDate)}</p>
        {event.location && <p>{event.location}</p>}
        <Button asChild variant="outline" size="sm" className="mt-2 w-full">
          <a
            href={event.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            JPA公式サイトで詳細を見る
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

export function EventList({ upcomingEvents, pastEvents }: EventListProps) {
  const [category, setCategory] = useState<EventCategory | "all">("all");
  const [showPast, setShowPast] = useState(false);

  const filterByCategory = (events: JpaEvent[]) => {
    if (category === "all") return events;
    return events.filter((e) => e.category === category);
  };

  const filteredUpcoming = filterByCategory(upcomingEvents);
  const filteredPast = filterByCategory(pastEvents);

  return (
    <div className="space-y-6">
      <EventFilters
        selected={category}
        onSelect={setCategory}
        showPast={showPast}
        onTogglePast={() => setShowPast((v) => !v)}
        pastCount={filteredPast.length}
      />

      {filteredUpcoming.length === 0 && !showPast && (
        <p className="text-center text-muted-foreground">
          該当するイベントはありません。
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredUpcoming.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {showPast && filteredPast.length > 0 && (
        <>
          <h2 className="mt-8 text-xl font-bold text-muted-foreground">
            過去のイベント
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPast.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
