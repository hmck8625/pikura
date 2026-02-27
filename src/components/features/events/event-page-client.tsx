"use client";

import { useState, useMemo } from "react";
import type { PickleballEvent } from "@/lib/events/types";
import { DEFAULT_FILTERS } from "@/lib/events/types";
import type { EventFilters } from "@/lib/events/types";
import { filterEvents, sortEventsByDate } from "@/lib/events/filters";
import { EventFiltersBar } from "./event-filters";
import { EventListView } from "./event-list-view";
import { EventViewToggle } from "./event-view-toggle";
import { EventMapWrapper } from "./event-map-wrapper";

type EventPageClientProps = {
  events: PickleballEvent[];
};

export function EventPageClient({ events }: EventPageClientProps) {
  const [filters, setFilters] = useState<EventFilters>(DEFAULT_FILTERS);
  const [view, setView] = useState<"list" | "map">("list");

  const filteredEvents = useMemo(() => {
    const filtered = filterEvents(events, filters);
    return sortEventsByDate(filtered);
  }, [events, filters]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1" />
        <EventViewToggle view={view} onViewChange={setView} />
      </div>

      <EventFiltersBar
        filters={filters}
        onFiltersChange={setFilters}
        totalCount={events.length}
        filteredCount={filteredEvents.length}
      />

      {view === "list" ? (
        <EventListView events={filteredEvents} />
      ) : (
        <EventMapWrapper events={filteredEvents} />
      )}
    </div>
  );
}
