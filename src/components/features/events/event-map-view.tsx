"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import type { PickleballEvent } from "@/lib/events/types";
import { EVENT_SOURCE_LABELS, EVENT_LEVEL_LABELS } from "@/lib/events/types";
import { PREFECTURE_COORDINATES } from "@/lib/events/prefecture-coordinates";

type EventMapViewProps = {
  events: PickleballEvent[];
};

function formatDate(dateString: string | null): string {
  if (!dateString) return "日程未定";
  return new Date(dateString).toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
  });
}

// ソース別マーカーアイコンの色
const SOURCE_ICON_COLORS: Record<string, string> = {
  jpa: "#3b82f6",       // blue
  tennisbear: "#22c55e", // green
  pjf: "#f97316",       // orange
  manual: "#6b7280",    // gray
};

function createIcon(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}"/>
    <circle cx="12" cy="12" r="5" fill="white"/>
  </svg>`;

  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  });
}

function getEventCoordinates(event: PickleballEvent): { lat: number; lng: number } | null {
  if (event.latitude !== null && event.longitude !== null) {
    return { lat: event.latitude, lng: event.longitude };
  }
  if (event.prefecture) {
    const coords = PREFECTURE_COORDINATES[event.prefecture];
    if (coords) return coords;
  }
  return null;
}

export function EventMapView({ events }: EventMapViewProps) {
  // Leaflet のデフォルトアイコンパス問題を修正
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "",
      iconUrl: "",
      shadowUrl: "",
    });
  }, []);

  const eventsWithCoords = events
    .map((event) => ({
      event,
      coords: getEventCoordinates(event),
    }))
    .filter((item): item is { event: PickleballEvent; coords: { lat: number; lng: number } } =>
      item.coords !== null
    );

  return (
    <div className="h-[500px] w-full overflow-hidden rounded-lg border sm:h-[600px]">
      <MapContainer
        center={[36.5, 137.5]}
        zoom={5}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {eventsWithCoords.map(({ event, coords }) => (
          <Marker
            key={event.id}
            position={[coords.lat, coords.lng]}
            icon={createIcon(SOURCE_ICON_COLORS[event.source] ?? "#6b7280")}
          >
            <Popup>
              <div className="max-w-[250px] space-y-1">
                <p className="text-xs text-gray-500">
                  {EVENT_SOURCE_LABELS[event.source]}
                </p>
                <p className="font-semibold leading-tight">
                  <Link href={`/events/${event.id}`} className="hover:underline">
                    {event.title.length > 50
                      ? `${event.title.slice(0, 50)}...`
                      : event.title}
                  </Link>
                </p>
                <p className="text-sm">{formatDate(event.eventDate)}</p>
                {event.level !== "unknown" && (
                  <p className="text-xs text-gray-600">
                    レベル: {EVENT_LEVEL_LABELS[event.level]}
                  </p>
                )}
                {event.entryFee && (
                  <p className="text-xs text-gray-600">{event.entryFee}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
