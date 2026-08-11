"use client";

import { useState } from "react";
import type { Event, MediaType } from "@/types/api";
import { useGallerySubmissions } from "@/lib/hooks/useSubmissions";
import { SubmissionCard } from "@/components/shared/SubmissionCard";
import { SubmissionGridSkeleton } from "@/components/shared/SubmissionCardSkeleton";
import { FadeIn } from "@/components/shared/FadeIn";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const PAGE_SIZE = 24;

export function GalleryClient({ events }: { events: Event[] }) {
  const [eventId, setEventId] = useState("ALL");
  const [mediaType, setMediaType] = useState<MediaType | "ALL">("ALL");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data: submissions, isLoading } = useGallerySubmissions({
    eventId: eventId === "ALL" ? undefined : eventId,
    mediaType: mediaType === "ALL" ? undefined : mediaType,
    limit: visibleCount,
  });

  const hasMore = (submissions?.length ?? 0) >= visibleCount;

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-3">
        <Select
          value={eventId}
          onValueChange={(v) => {
            setEventId(v ?? "ALL");
            setVisibleCount(PAGE_SIZE);
          }}
        >
          <SelectTrigger className="w-56">
            <SelectValue>
              {(value: string) => (value === "ALL" ? "All events" : (events.find((e) => e.id === value)?.name ?? "All events"))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All events</SelectItem>
            {events.map((event) => (
              <SelectItem key={event.id} value={event.id}>
                {event.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={mediaType}
          onValueChange={(v) => {
            setMediaType((v as MediaType | "ALL") ?? "ALL");
            setVisibleCount(PAGE_SIZE);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue>
              {(value: string) => ({ ALL: "All media", VIDEO: "Videos", IMAGE: "Photos" })[value] ?? "All media"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All media</SelectItem>
            <SelectItem value="VIDEO">Videos</SelectItem>
            <SelectItem value="IMAGE">Photos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <SubmissionGridSkeleton count={8} />
      ) : !submissions || submissions.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No entries match these filters yet.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {submissions.map((submission, i) => (
              <FadeIn key={submission.id} delay={(i % PAGE_SIZE) * 40}>
                <SubmissionCard submission={submission} />
              </FadeIn>
            ))}
          </div>
          {hasMore && (
            <div className="mt-10 flex justify-center">
              <Button variant="outline" size="lg" onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
