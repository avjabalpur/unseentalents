"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useEvents } from "@/lib/hooks/useEvents";

export function EventsNavDropdown() {
  const [open, setOpen] = useState(false);
  const { data: events } = useEvents();

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium uppercase tracking-wide text-white/90 hover:text-primary">
        Events <ChevronDown className="size-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-full w-64 rounded-md border border-white/10 bg-black py-2 shadow-xl">
          <Link
            href="/events"
            className="block border-b border-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-primary hover:bg-white/5"
          >
            View all events
          </Link>
          {events && events.length > 0 ? (
            events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="block px-4 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-primary"
              >
                {event.name}
              </Link>
            ))
          ) : (
            <p className="px-4 py-2 text-sm text-muted-foreground">No events yet</p>
          )}
        </div>
      )}
    </div>
  );
}
