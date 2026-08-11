import { API_BASE_URL } from "@/lib/api-client";
import type { Event } from "@/types/api";
import { GalleryClient } from "@/components/user/GalleryClient";

async function getEvents(): Promise<Event[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/events`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as Event[];
  } catch {
    return [];
  }
}

export default async function GalleryPage() {
  const events = await getEvents();

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-12">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">Browse entries</p>
      <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide sm:text-3xl">
        The <span className="text-primary">gallery</span>
      </h1>
      <div className="mt-3 mb-8 h-[3px] w-16 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/2 animate-pulse bg-primary" />
      </div>
      <GalleryClient events={events} />
    </div>
  );
}
