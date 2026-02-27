"use client";

// This file is kept for backward compatibility.
// The main events page now uses EventPageClient instead.
// This component can be removed once all references are updated.

import { EventPageClient } from "./event-page-client";
import type { PickleballEvent } from "@/lib/events/types";

type EventListProps = {
  upcomingEvents: PickleballEvent[];
  pastEvents: PickleballEvent[];
};

export function EventList({ upcomingEvents, pastEvents }: EventListProps) {
  const events = [...upcomingEvents, ...pastEvents];
  return <EventPageClient events={events} />;
}
