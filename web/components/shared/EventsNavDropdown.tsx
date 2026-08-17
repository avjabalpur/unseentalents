"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useEvents } from "@/lib/hooks/useEvents";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  UPCOMING: "Upcoming",
  ONGOING: "Going on",
};

export function EventsNavDropdown({ active = false }: { active?: boolean }) {
  const [open, setOpen] = useState(false);
  const { data: events } = useEvents();

  const visibleEvents = (events ?? []).filter(
    (event) => event.computedStatus === "UPCOMING" || event.computedStatus === "ONGOING",
  );

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        className={cn(
          "flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium uppercase tracking-wide transition-colors",
          active ? "bg-primary/15 text-white" : "text-white/80 hover:bg-white/5 hover:text-primary",
        )}
      >
        Events <ChevronDown className="size-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-full w-64 pt-2">
          <div className="rounded-xl border border-white/10 bg-black py-2 shadow-xl">
            <Link
              href="/events"
              className="block border-b border-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-primary hover:bg-white/5"
            >
              View all events
            </Link>
            {visibleEvents.length > 0 ? (
              visibleEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-primary"
                >
                  <span className="truncate">{event.name}</span>
                  {event.computedStatus && (
                    <span
                      className={cn(
                        "shrink-0 text-xs",
                        event.computedStatus === "ONGOING" ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {STATUS_LABELS[event.computedStatus]}
                    </span>
                  )}
                </Link>
              ))
            ) : (
              <p className="px-4 py-2 text-sm text-muted-foreground">No upcoming events right now</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
