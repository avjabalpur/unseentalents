"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useEvent, useEventStages } from "@/lib/hooks/useEvents";
import { useEventTypes } from "@/lib/hooks/useEventTypes";
import { useCreateStage, useCloseStage, useStageResults, useAdvanceStage } from "@/lib/hooks/useAdmin";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import type { AdvanceMode, StageName } from "@/types/api";
import { EventStatusBadge } from "@/components/shared/EventStatusBadge";
import { Breadcrumb } from "@/components/admin/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CollapsibleFormCard } from "@/components/admin/CollapsibleFormCard";
import { TableSkeleton } from "@/components/admin/TableSkeleton";

const STAGE_NAMES: StageName[] = [
  "BACKSTAGE",
  "MAINSTAGE",
  "TOP_60",
  "TOP_50",
  "TOP_40",
  "TOP_30",
  "TOP_15",
  "TOP_5",
  "WINNER",
];

function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function StagesAdminClient({ eventId }: { eventId: string }) {
  const { data: event } = useEvent(eventId);
  const { data: eventTypes } = useEventTypes();
  const eventType = eventTypes?.find((et) => et.id === event?.eventTypeId);
  const { data: stages, isLoading } = useEventStages(eventId);
  const createStage = useCreateStage(eventId);
  const closeStage = useCloseStage();

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState<StageName>("BACKSTAGE");
  const [orderIndex, setOrderIndex] = useState(1);
  const [startAt, setStartAt] = useState(toDatetimeLocalValue(new Date()));
  const [endAt, setEndAt] = useState(toDatetimeLocalValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
  const [advanceMode, setAdvanceMode] = useState<AdvanceMode>("ADMIN_CURATED");
  const [advanceCount, setAdvanceCount] = useState(10);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    createStage.mutate(
      {
        name,
        orderIndex,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        advanceMode,
        advanceCount: advanceMode === "AUTO_TOP_N" ? advanceCount : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Stage created.");
          setOrderIndex((n) => n + 1);
          setFormOpen(false);
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to create stage."),
      },
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/admin" },
            { label: "Events", href: "/admin/events" },
            { label: event?.name ?? "Event" },
            { label: "Stages" },
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

      <CollapsibleFormCard title="Add stage" triggerLabel="Add stage" open={formOpen} onOpenChange={setFormOpen}>
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Stage</Label>
            <Select value={name} onValueChange={(v) => v && setName(v as StageName)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGE_NAMES.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Order</Label>
            <Input type="number" min={1} value={orderIndex} onChange={(e) => setOrderIndex(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Start</Label>
            <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>End</Label>
            <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Advancement rule</Label>
            <Select value={advanceMode} onValueChange={(v) => v && setAdvanceMode(v as AdvanceMode)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN_CURATED">Admin curated</SelectItem>
                <SelectItem value="AUTO_TOP_N">Auto top N</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {advanceMode === "AUTO_TOP_N" && (
            <div className="space-y-1.5">
              <Label>Advance top N</Label>
              <Input
                type="number"
                min={1}
                value={advanceCount}
                onChange={(e) => setAdvanceCount(Number(e.target.value))}
              />
            </div>
          )}
          <Button type="submit" className="sm:col-span-2 sm:w-fit" disabled={createStage.isPending}>
            {createStage.isPending ? "Creating…" : "Add stage"}
          </Button>
        </form>
      </CollapsibleFormCard>

      <Card className="shadow-md shadow-black/20">
        <CardHeader>
          <CardTitle>Stage pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton columns={5} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Window</TableHead>
                  <TableHead>Rule</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...(stages ?? [])]
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((stage) => (
                    <TableRow key={stage.id}>
                      <TableCell>{stage.orderIndex}</TableCell>
                      <TableCell className="font-medium">{stage.name.replace("_", " ")}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(stage.startAt)} – {formatDate(stage.endAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {stage.advanceMode === "AUTO_TOP_N" ? `Top ${stage.advanceCount}` : "Admin curated"}
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={closeStage.isPending}
                          onClick={() =>
                            closeStage.mutate(stage.id, {
                              onSuccess: () => toast.success("Stage closed — results tallied."),
                              onError: (err) =>
                                toast.error(err instanceof ApiError ? err.message : "Failed to close stage."),
                            })
                          }
                        >
                          Close now
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setExpandedStage((cur) => (cur === stage.id ? null : stage.id))}
                        >
                          {expandedStage === stage.id ? "Hide results" : "View results"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {expandedStage && <StageResultsPanel stageId={expandedStage} />}
    </div>
  );
}

function StageResultsPanel({ stageId }: { stageId: string }) {
  const { data: results, isLoading } = useStageResults(stageId);
  const advanceStage = useAdvanceStage(stageId);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (participationId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(participationId)) next.delete(participationId);
      else next.add(participationId);
      return next;
    });
  };

  return (
    <Card className="shadow-md shadow-black/20">
      <CardHeader>
        <CardTitle>Results</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TableSkeleton columns={4} />
        ) : !results || results.length === 0 ? (
          <p className="text-muted-foreground">No results yet — close the stage to tally votes.</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Votes</TableHead>
                  <TableHead>Advanced</TableHead>
                  <TableHead>Select</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>#{r.rank}</TableCell>
                    <TableCell>{r.voteCount}</TableCell>
                    <TableCell>{r.advanced ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selected.has(r.participationId)}
                        onChange={() => toggle(r.participationId)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button
              className="mt-4"
              disabled={selected.size === 0 || advanceStage.isPending}
              onClick={() =>
                advanceStage.mutate(Array.from(selected), {
                  onSuccess: () => toast.success("Advanced selected participants."),
                  onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to advance."),
                })
              }
            >
              Advance selected to next stage
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
