import { notFound } from "next/navigation";
import { API_BASE_URL } from "@/lib/api-client";
import type { Event, Prize, Stage } from "@/types/api";
import { EventDetailClient } from "@/components/user/EventDetailClient";

async function getEvent(eventId: string): Promise<Event | null> {
  const res = await fetch(`${API_BASE_URL}/api/v1/events/${eventId}`, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as Event;
}

async function getStages(eventId: string): Promise<Stage[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/events/${eventId}/stages`, { cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()) as Stage[];
}

async function getPrizes(eventId: string): Promise<Prize[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/events/${eventId}/prizes`, { cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()) as Prize[];
}

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const [event, stages, prizes] = await Promise.all([getEvent(eventId), getStages(eventId), getPrizes(eventId)]);

  if (!event) notFound();

  return <EventDetailClient event={event} stages={stages} prizes={prizes} />;
}
