"use client";

import Link from "next/link";
import { useState } from "react";
import type { ComputedEventStatus, Event } from "@/types/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventStatusBadge } from "@/components/shared/EventStatusBadge";
import { FadeIn } from "@/components/shared/FadeIn";

const TABS: { value: ComputedEventStatus; label: string }[] = [
  { value: "ONGOING", label: "Ongoing" },
  { value: "UPCOMING", label: "Upcoming" },
  { value: "CLOSED", label: "Closed" },
];

export function EventsBrowser({ events }: { events: Event[] }) {
  const [tab, setTab] = useState<ComputedEventStatus>("ONGOING");

  const grouped: Record<ComputedEventStatus, Event[]> = { ONGOING: [], UPCOMING: [], CLOSED: [] };
  for (const event of events) {
    const status = event.computedStatus ?? "UPCOMING";
    grouped[status].push(event);
  }

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as ComputedEventStatus)}>
      <TabsList>
        {TABS.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label} ({grouped[t.value].length})
          </TabsTrigger>
        ))}
      </TabsList>
      {TABS.map((t) => (
        <TabsContent key={t.value} value={t.value} className="mt-6">
          {grouped[t.value].length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">
              No {t.label.toLowerCase()} events right now.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {grouped[t.value].map((event, i) => (
                <FadeIn key={event.id} delay={i * 80}>
                  <Link href={`/events/${event.id}`}>
                    <Card className="h-full border-white/10 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
                      <CardHeader className="flex flex-row items-start justify-between gap-2">
                        <CardTitle className="text-lg">{event.name}</CardTitle>
                        <EventStatusBadge status={event.computedStatus ?? "UPCOMING"} />
                      </CardHeader>
                      <CardContent>
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {event.description ?? "No description yet."}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </FadeIn>
              ))}
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
