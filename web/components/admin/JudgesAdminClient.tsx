"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Gavel, UserPlus, X } from "lucide-react";
import { useEvent } from "@/lib/hooks/useEvents";
import { useEventTypes } from "@/lib/hooks/useEventTypes";
import { useAssignJudge, useEventJudges, useRemoveJudge } from "@/lib/hooks/useJudges";
import { useUserSearch } from "@/lib/hooks/useUserSearch";
import { ApiError } from "@/lib/api-client";
import { EventStatusBadge } from "@/components/shared/EventStatusBadge";
import { Breadcrumb, type BreadcrumbItem } from "@/components/admin/Breadcrumb";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const MIN_JUDGES = 1;
const MAX_JUDGES = 5;

const DEFAULT_BREADCRUMB_BASE: BreadcrumbItem[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Events", href: "/admin/events" },
];

export function JudgesAdminClient({
  eventId,
  breadcrumbBase = DEFAULT_BREADCRUMB_BASE,
}: {
  eventId: string;
  breadcrumbBase?: BreadcrumbItem[];
}) {
  const { data: event } = useEvent(eventId);
  const { data: eventTypes } = useEventTypes();
  const eventType = eventTypes?.find((et) => et.id === event?.eventTypeId);
  const { data: judges, isLoading } = useEventJudges(eventId);
  const assignJudge = useAssignJudge(eventId);
  const removeJudge = useRemoveJudge(eventId);

  const [query, setQuery] = useState("");
  const { data: results, isLoading: searching } = useUserSearch(query);

  const judgeCount = judges?.length ?? 0;
  const alreadyJudgeIds = new Set(judges?.map((j) => j.userId));

  if (event && event.winningMode !== "JUDGE_SCORE") {
    return (
      <div>
        <Breadcrumb items={[...breadcrumbBase, { label: event.name }, { label: "Judges" }]} />
        <EmptyState
          icon={Gavel}
          title="Not a judge-scored event"
          description={`This event's winning mode is "${event.winningMode.replace("_", " ").toLowerCase()}" — judges only apply to judge-scored events.`}
        />
      </div>
    );
  }

  const handleAssign = (userId: string) => {
    assignJudge.mutate(userId, {
      onSuccess: () => {
        toast.success("Judge assigned.");
        setQuery("");
      },
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to assign judge."),
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <Breadcrumb items={[...breadcrumbBase, { label: event?.name ?? "Event" }, { label: "Judges" }]} />
        {event ? (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-medium text-foreground">{event.name}</p>
            {event.computedStatus && <EventStatusBadge status={event.computedStatus} />}
            {eventType && <Badge variant="secondary">{eventType.name}</Badge>}
          </div>
        ) : (
          <div className="h-6 w-48 animate-pulse rounded bg-accent" />
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          Assign {MIN_JUDGES}–{MAX_JUDGES} judges — required before this event can be published, since it&apos;s set
          to judge-scored winning.
        </p>
      </div>

      <Card className="shadow-md shadow-black/20">
        <CardHeader>
          <CardTitle>Add a judge</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Search by name or username…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={judgeCount >= MAX_JUDGES}
          />
          {judgeCount >= MAX_JUDGES && (
            <p className="text-sm text-muted-foreground">Maximum of {MAX_JUDGES} judges reached.</p>
          )}
          {query.trim().length >= 2 && (
            <div className="divide-y divide-border rounded-lg border border-border">
              {searching ? (
                <p className="p-3 text-sm text-muted-foreground">Searching…</p>
              ) : !results || results.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">No matching users.</p>
              ) : (
                results.map((u) => (
                  <div key={u.id} className="flex items-center justify-between gap-3 p-3">
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">@{u.username}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={alreadyJudgeIds.has(u.id) || judgeCount >= MAX_JUDGES || assignJudge.isPending}
                      onClick={() => handleAssign(u.id)}
                    >
                      <UserPlus className="size-4" />
                      {alreadyJudgeIds.has(u.id) ? "Already a judge" : "Add"}
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-md shadow-black/20">
        <CardHeader>
          <CardTitle>Assigned judges ({judgeCount}/{MAX_JUDGES})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !judges || judges.length === 0 ? (
            <EmptyState icon={Gavel} title="No judges yet" description="Search above to assign this event's judge panel." />
          ) : (
            <div className="space-y-2">
              {judges.map((judge) => (
                <div
                  key={judge.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium">{judge.judgeName ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">@{judge.judgeUsername}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Remove judge"
                    disabled={removeJudge.isPending}
                    onClick={() =>
                      removeJudge.mutate(judge.id, {
                        onSuccess: () => toast.success("Judge removed."),
                        onError: (err) =>
                          toast.error(err instanceof ApiError ? err.message : "Failed to remove judge."),
                      })
                    }
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
