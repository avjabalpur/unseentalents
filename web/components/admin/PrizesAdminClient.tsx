"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Trash2, Trophy } from "lucide-react";
import { useEvent, useEventPrizes } from "@/lib/hooks/useEvents";
import { useEventTypes } from "@/lib/hooks/useEventTypes";
import { useCreatePrize, useDeletePrize } from "@/lib/hooks/useAdmin";
import { ApiError } from "@/lib/api-client";
import { EventStatusBadge } from "@/components/shared/EventStatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CollapsibleFormCard } from "@/components/admin/CollapsibleFormCard";

export function PrizesAdminClient({ eventId }: { eventId: string }) {
  const { data: event } = useEvent(eventId);
  const { data: eventTypes } = useEventTypes();
  const eventType = eventTypes?.find((et) => et.id === event?.eventTypeId);
  const { data: prizes, isLoading } = useEventPrizes(eventId);
  const createPrize = useCreatePrize(eventId);
  const deletePrize = useDeletePrize(eventId);

  const [formOpen, setFormOpen] = useState(false);
  const [rank, setRank] = useState(1);
  const [title, setTitle] = useState("");
  const [reward, setReward] = useState("");

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    createPrize.mutate(
      { rank, title, reward },
      {
        onSuccess: () => {
          toast.success("Prize added.");
          setRank((n) => n + 1);
          setTitle("");
          setReward("");
          setFormOpen(false);
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to add prize."),
      },
    );
  };

  const sortedPrizes = [...(prizes ?? [])].sort((a, b) => a.rank - b.rank);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Prizes &amp; Awards</h1>
        {event ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="text-lg font-medium text-white">{event.name}</p>
            {event.computedStatus && <EventStatusBadge status={event.computedStatus} />}
            {eventType && <Badge variant="secondary">{eventType.name}</Badge>}
          </div>
        ) : (
          <div className="mt-3 h-6 w-48 animate-pulse rounded bg-white/5" />
        )}
        {event?.description && <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>}
      </div>

      <CollapsibleFormCard
        title="Add a prize"
        triggerLabel="Add prize"
        open={formOpen}
        onOpenChange={setFormOpen}
      >
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Rank</Label>
            <Input type="number" min={1} value={rank} onChange={(e) => setRank(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              placeholder="e.g. 1st Place, Winner, Best Newcomer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Reward</Label>
            <Input
              placeholder="e.g. $500 Cash, $100 Amazon Voucher"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="sm:col-span-3 sm:w-fit" disabled={createPrize.isPending}>
            {createPrize.isPending ? "Adding…" : "Add prize"}
          </Button>
        </form>
      </CollapsibleFormCard>

      <Card>
        <CardHeader>
          <CardTitle>Prizes for this event</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : sortedPrizes.length === 0 ? (
            <p className="text-muted-foreground">No prizes added yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPrizes.map((prize) => (
                  <TableRow key={prize.id}>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5">
                        <Trophy className="size-4 text-primary" />#{prize.rank}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{prize.title}</TableCell>
                    <TableCell>{prize.reward}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={deletePrize.isPending}
                        onClick={() =>
                          deletePrize.mutate(prize.id, {
                            onSuccess: () => toast.success("Prize removed."),
                            onError: (err) =>
                              toast.error(err instanceof ApiError ? err.message : "Failed to remove prize."),
                          })
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
