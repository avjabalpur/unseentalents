"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useEventTypes } from "@/lib/hooks/useEventTypes";
import { useEvents, useEventStages, useMyParticipation, useParticipate } from "@/lib/hooks/useEvents";
import { useMySubmissions } from "@/lib/hooks/useSubmissions";
import { ApiError, mediaUrl } from "@/lib/api-client";
import type { Stage } from "@/types/api";
import { SubmissionUploadForm } from "@/components/user/SubmissionUploadForm";
import { MediaPlayer } from "@/components/shared/MediaPlayer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function findActiveStage(stages: Stage[]): Stage | null {
  const now = new Date();
  return stages.find((s) => new Date(s.startAt) <= now && now <= new Date(s.endAt)) ?? null;
}

export function UploadWizard() {
  const { user } = useAuth();
  const { data: eventTypes } = useEventTypes();
  const { data: events } = useEvents();

  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const { data: stages } = useEventStages(selectedEventId ?? undefined);
  const activeStage = stages ? findActiveStage(stages) : null;

  const { data: participation } = useMyParticipation(selectedEventId ?? undefined, !!user && !!selectedEventId);
  const participate = useParticipate(selectedEventId ?? "");

  const { data: mySubmissions } = useMySubmissions(!!user);

  const filteredEvents = events?.filter((e) => e.eventTypeId === selectedTypeId) ?? [];
  const selectedEvent = events?.find((e) => e.id === selectedEventId);
  const selectedType = eventTypes?.find((t) => t.id === selectedTypeId);

  const isEligibleToUpload = !!activeStage && !!participation && participation.currentStageId === activeStage.id;

  if (!user) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <CardContent className="py-10">
          <p className="mb-4 text-muted-foreground">Log in to upload your entry.</p>
          <Button nativeButton={false} render={<a href="/login?redirect=/upload">Log in</a>} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Choose a category</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {eventTypes?.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  setSelectedTypeId(type.id);
                  setSelectedEventId(null);
                }}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  selectedTypeId === type.id
                    ? "border-primary bg-primary/10"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <p className="font-semibold">{type.name}</p>
                <p className="text-xs text-muted-foreground">{type.submissionMediaType.toLowerCase()}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        {selectedTypeId && (
          <Card>
            <CardHeader>
              <CardTitle>2. Choose a competition</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No {selectedType?.name.toLowerCase()} competitions right now.
                </p>
              ) : (
                filteredEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => setSelectedEventId(event.id)}
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                      selectedEventId === event.id
                        ? "border-primary bg-primary/10"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <span>{event.name}</span>
                    <Badge variant="secondary">{event.computedStatus}</Badge>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {selectedEventId && selectedEvent && selectedType && (
          <div>
            {!participation && (
              <Card className="mb-4">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <p className="text-sm text-muted-foreground">Enter this competition to upload your entry.</p>
                  <Button
                    disabled={participate.isPending}
                    onClick={() =>
                      participate.mutate(undefined, {
                        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't join."),
                      })
                    }
                  >
                    {participate.isPending ? "Joining…" : "Enter competition"}
                  </Button>
                </CardContent>
              </Card>
            )}
            {isEligibleToUpload && activeStage ? (
              <SubmissionUploadForm stageId={activeStage.id} mediaType={selectedType.submissionMediaType} />
            ) : participation ? (
              <p className="text-sm text-muted-foreground">
                No active submission window for this competition right now.
              </p>
            ) : null}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold uppercase tracking-wide">Your uploads</h2>
        <div className="space-y-4">
          {!mySubmissions || mySubmissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">You haven&apos;t uploaded anything yet.</p>
          ) : (
            mySubmissions.map((submission) => {
              const posterUrl = mediaUrl(submission.thumbnailKey);
              const videoUrl = submission.mediaType === "VIDEO" ? mediaUrl(submission.storageKey) : null;
              const imageUrl = submission.mediaType === "IMAGE" ? mediaUrl(submission.storageKey) : null;
              return (
                <Card key={submission.id} className="overflow-hidden py-0 gap-0">
                  <div className="aspect-video bg-black">
                    <MediaPlayer
                      mediaType={submission.mediaType}
                      videoUrl={videoUrl}
                      imageUrl={imageUrl}
                      posterUrl={posterUrl}
                    />
                  </div>
                  <CardContent className="space-y-1 py-3">
                    <p className="text-sm font-medium">{submission.eventName}</p>
                    {submission.notes && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">{submission.notes}</p>
                    )}
                    <Badge variant={submission.status === "APPROVED" ? "default" : "secondary"}>
                      {submission.status}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
