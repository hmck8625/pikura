import type { PickleballEvent } from "@/lib/events/types";
import { EventCard } from "./event-card";

type EventListViewProps = {
  events: PickleballEvent[];
};

export function EventListView({ events }: EventListViewProps) {
  if (events.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        該当するイベントはありません。
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
