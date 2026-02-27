"use client";

import dynamic from "next/dynamic";
import type { PickleballEvent } from "@/lib/events/types";

const EventMapView = dynamic(
  () => import("./event-map-view").then((mod) => ({ default: mod.EventMapView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[500px] items-center justify-center rounded-lg border bg-muted/20 sm:h-[600px]">
        <p className="text-muted-foreground">地図を読み込み中...</p>
      </div>
    ),
  }
);

type EventMapWrapperProps = {
  events: PickleballEvent[];
};

export function EventMapWrapper({ events }: EventMapWrapperProps) {
  return <EventMapView events={events} />;
}
