import { API_BASE_URL } from "@/lib/api-client";
import type { Event, EventType } from "@/types/api";
import { AllEventsClient } from "@/components/user/AllEventsClient";

async function getEvents(): Promise<Event[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/events`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as Event[];
  } catch {
    return [];
  }
}

async function getEventTypes(): Promise<EventType[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/event-types`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as EventType[];
  } catch {
    return [];
  }
}

export default async function AllEventsPage() {
  const [events, eventTypes] = await Promise.all([getEvents(), getEventTypes()]);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-12">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">Every competition</p>
      <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide sm:text-3xl">
        All <span className="text-primary">events</span>
      </h1>
      <div className="mt-3 mb-8 h-[3px] w-16 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/2 animate-pulse bg-primary" />
      </div>
      <AllEventsClient events={events} eventTypes={eventTypes} />
    </div>
  );
}
