"use client";

import Link from "next/link";
import { CheckCircle2, Clock3, Film, Trophy, Users, XCircle } from "lucide-react";
import { useEvent, useEventOverview } from "@/lib/hooks/useEvents";
import { useEventTypes } from "@/lib/hooks/useEventTypes";
import { formatDate } from "@/lib/format";
import { EventStatusBadge } from "@/components/shared/EventStatusBadge";
import { Breadcrumb } from "@/components/admin/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  icon: Icon,
  accent = "bg-primary/15 text-primary",
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
}) {
  return (
    <Card className="shadow-md shadow-black/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
          <span className={cn("flex size-9 items-center justify-center rounded-full", accent)}>
            <Icon className="size-4.5" />
          </span>
        </div>
      </CardHeader>
      <CardContent className="text-3xl font-bold">{value}</CardContent>
    </Card>
  );
}

export function EventOverviewAdminClient({ eventId }: { eventId: string }) {
  const { data: event } = useEvent(eventId);
  const { data: eventTypes } = useEventTypes();
  const eventType = eventTypes?.find((et) => et.id === event?.eventTypeId);
  const { data: overview, isLoading } = useEventOverview(eventId);

  const currentStage = overview?.stages.find((s) => s.isCurrent);

  return (
    <div className="space-y-8">
      <div>
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/admin" },
            { label: "Events", href: "/admin/events" },
            { label: event?.name ?? "Event" },
            { label: "Overview" },
          ]}
        />
        {event ? (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-medium text-foreground">{event.name}</p>
            {event.computedStatus && <EventStatusBadge status={event.computedStatus} />}
            {eventType && <Badge variant="secondary">{eventType.name}</Badge>}
          </div>
        ) : (
          <div className="h-6 w-48 animate-pulse rounded bg-accent" />
        )}
        {event?.description && <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>}
      </div>

      {isLoading || !overview ? (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-accent" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard
              label="Current stage"
              value={currentStage ? currentStage.name.replace("_", " ") : "—"}
              icon={Clock3}
            />
            <StatCard label="Participants" value={overview.totalParticipants} icon={Users} />
            <StatCard label="Entries uploaded" value={overview.totalSubmissions} icon={Film} />
            <StatCard
              label="Approved"
              value={overview.totalApproved}
              icon={CheckCircle2}
              accent="bg-emerald-500/15 text-emerald-400"
            />
            <StatCard
              label="Rejected"
              value={overview.totalRejected}
              icon={XCircle}
              accent="bg-red-500/15 text-red-400"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Active participants" value={overview.activeParticipants} icon={Users} />
            <StatCard
              label="Eliminated"
              value={overview.eliminatedParticipants}
              icon={XCircle}
              accent="bg-white/10 text-muted-foreground"
            />
            <StatCard
              label="Winners"
              value={overview.winnerCount}
              icon={Trophy}
              accent="bg-amber-500/15 text-amber-400"
            />
          </div>

          <Card className="shadow-md shadow-black/20">
            <CardHeader>
              <CardTitle>Stage-by-stage progress</CardTitle>
            </CardHeader>
            <CardContent>
              {overview.stages.length === 0 ? (
                <p className="text-muted-foreground">No stages configured for this event yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stage</TableHead>
                      <TableHead>Window</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Entries uploaded</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Approved</TableHead>
                      <TableHead>Rejected</TableHead>
                      <TableHead>Advanced</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.stages.map((stage) => (
                      <TableRow key={stage.stageId}>
                        <TableCell className="font-medium">{stage.name.replace("_", " ")}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(stage.startAt)} – {formatDate(stage.endAt)}
                        </TableCell>
                        <TableCell>
                          {stage.isCurrent ? (
                            <Badge>Current</Badge>
                          ) : stage.closedAt ? (
                            <Badge variant="secondary">Closed</Badge>
                          ) : (
                            <Badge variant="outline">Upcoming</Badge>
                          )}
                        </TableCell>
                        <TableCell>{stage.submissionCount}</TableCell>
                        <TableCell>{stage.pendingCount}</TableCell>
                        <TableCell>{stage.approvedCount}</TableCell>
                        <TableCell>{stage.rejectedCount}</TableCell>
                        <TableCell>{stage.advancedCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <Link href={`/admin/events/${eventId}/stages`} className="text-primary underline-offset-4 hover:underline">
              Manage stages
            </Link>
            <span>·</span>
            <Link href="/admin/moderation" className="text-primary underline-offset-4 hover:underline">
              Go to moderation queue
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
