"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, History, Layers, Tag } from "lucide-react";
import type { ComputedEventStatus, Event, EventType } from "@/types/api";
import { formatAge, formatCountdown, formatDate } from "@/lib/format";
import { EventStatusBadge } from "@/components/shared/EventStatusBadge";
import { FadeIn } from "@/components/shared/FadeIn";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: { value: ComputedEventStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "ONGOING", label: "Ongoing" },
  { value: "UPCOMING", label: "Upcoming" },
  { value: "CLOSED", label: "Closed" },
];

function EventTile({
  event,
  eventType,
  now,
}: {
  event: Event;
  eventType: EventType | undefined;
  now: Date;
}) {
  const router = useRouter();
  const status = event.computedStatus ?? "UPCOMING";
  const countdown = event.finalStageEndAt ? formatCountdown(event.finalStageEndAt, now) : null;
  const isUrgent =
    status === "ONGOING" &&
    !!event.finalStageEndAt &&
    new Date(event.finalStageEndAt).getTime() - now.getTime() < 24 * 60 * 60 * 1000;
  const stages = [...event.stages].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div
      onClick={() => router.push(`/events/${event.id}`)}
      className="group flex cursor-pointer flex-col rounded-2xl border border-white/10 bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <EventStatusBadge status={status} />
            {eventType && (
              <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
                <Tag className="size-3.5" />
                {eventType.name}
              </span>
            )}
          </div>
          <h3 className="font-heading text-xl font-bold text-white transition-colors group-hover:text-primary sm:text-2xl">
            {event.name}
          </h3>
          {event.description && (
            <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
          )}
        </div>

        {countdown && status !== "CLOSED" ? (
          <Badge
            variant="secondary"
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-sm",
              isUrgent && "animate-pulse bg-primary/20 text-primary",
            )}
          >
            <Clock className="size-4" />
            {countdown}
          </Badge>
        ) : status === "CLOSED" ? (
          <Badge variant="secondary" className="shrink-0 px-3 py-1.5 text-sm">
            Finished
          </Badge>
        ) : null}
      </div>

      {stages.length > 0 && (
        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Layers className="size-3.5" />
            Stage pipeline
          </p>
          <div className="space-y-1.5">
            {stages.map((stage) => {
              const isCurrent = stage.name === event.currentStageName;
              const isPast = new Date(stage.endAt) < now;
              return (
                <div
                  key={stage.id}
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 rounded-lg border px-3 py-1.5 text-xs sm:text-sm",
                    isCurrent
                      ? "border-primary bg-primary/10 font-medium text-primary"
                      : isPast
                        ? "border-white/5 text-muted-foreground/50"
                        : "border-white/10 text-muted-foreground",
                  )}
                >
                  <span>{stage.name.replace("_", " ")}</span>
                  <span className="opacity-80">
                    {formatDate(stage.startAt)} – {formatDate(stage.endAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-white/10 pt-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5" />
          Created {formatDate(event.createdAt)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <History className="size-3.5" />
          {formatAge(event.createdAt, now)}
        </span>
        {event.finalStageEndAt && (
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" />
            Closes {formatDate(event.finalStageEndAt)}
          </span>
        )}
      </div>
    </div>
  );
}

export function AllEventsClient({ events, eventTypes }: { events: Event[]; eventTypes: EventType[] }) {
  const [statusFilter, setStatusFilter] = useState<ComputedEventStatus | "ALL">("ALL");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const eventTypeById = new Map(eventTypes.map((et) => [et.id, et]));
  const filtered = events.filter((e) => statusFilter === "ALL" || (e.computedStatus ?? "UPCOMING") === statusFilter);
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <FadeIn>
      <div className="mb-8 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium uppercase tracking-wide transition-colors",
              statusFilter === f.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-white/10 text-muted-foreground hover:border-white/30 hover:text-white",
            )}
          >
            {f.label}
            {f.value !== "ALL" &&
              ` (${events.filter((e) => (e.computedStatus ?? "UPCOMING") === f.value).length})`}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">No events match this filter.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {sorted.map((event, i) => (
            <FadeIn key={event.id} delay={i * 80}>
              <EventTile event={event} eventType={eventTypeById.get(event.eventTypeId)} now={now} />
            </FadeIn>
          ))}
        </div>
      )}
    </FadeIn>
  );
}
