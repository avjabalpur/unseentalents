"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, Plus, Trash2 } from "lucide-react";
import { useAdminEvents, useArchiveEvent, useCreateEvent, useDeleteEvent, usePublishEvent } from "@/lib/hooks/useAdmin";
import { useEventTypes } from "@/lib/hooks/useEventTypes";
import { ApiError } from "@/lib/api-client";
import type { Event } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import { Breadcrumb } from "@/components/admin/Breadcrumb";
import { WinningModeField } from "@/components/admin/WinningModeField";
import type { WinningMode } from "@/types/api";

export default function AdminEventsPage() {
  const { data: events, isLoading } = useAdminEvents();
  const { data: eventTypes } = useEventTypes();
  const createEvent = useCreateEvent();
  const publishEvent = usePublishEvent();
  const archiveEvent = useArchiveEvent();
  const deleteEvent = useDeleteEvent();

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eventTypeId, setEventTypeId] = useState<string>("");
  const [winningMode, setWinningMode] = useState<WinningMode>("AUDIENCE_VOTE");

  const handleDuplicate = (event: Event) => {
    setName(`Copy of ${event.name}`);
    setDescription(event.description ?? "");
    setEventTypeId(event.eventTypeId);
    setWinningMode(event.winningMode);
    setFormOpen(true);
  };

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!eventTypeId) {
      toast.error("Pick an event type first.");
      return;
    }
    createEvent.mutate(
      { name, description, eventTypeId, winningMode },
      {
        onSuccess: () => {
          toast.success("Event created as draft.");
          setName("");
          setDescription("");
          setFormOpen(false);
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to create event."),
      },
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <Breadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Events" }]} />
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          Add event
        </Button>
      </div>

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Create event</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <form id="create-event-form" onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Event type</Label>
                <Select value={eventTypeId} onValueChange={(v) => setEventTypeId(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes?.map((et) => (
                      <SelectItem key={et.id} value={et.id}>
                        {et.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <WinningModeField value={winningMode} onChange={setWinningMode} />
            </form>
          </SheetBody>
          <SheetFooter>
            <Button type="submit" form="create-event-form" disabled={createEvent.isPending}>
              {createEvent.isPending ? "Creating…" : "Create event"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Card className="shadow-md shadow-black/20">
        <CardHeader>
          <CardTitle>All events</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton columns={9} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Overview</TableHead>
                  <TableHead>Stages</TableHead>
                  <TableHead>Prizes</TableHead>
                  <TableHead>Judges</TableHead>
                  <TableHead>Publish</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events?.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{event.creatorName ?? "—"}</span>
                        {event.creatorRole === "ORGANIZER" && (
                          <Badge variant="outline" className="text-xs">
                            Organizer
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          event.status === "PUBLISHED"
                            ? "default"
                            : event.status === "PENDING_REVIEW"
                              ? "outline"
                              : "secondary"
                        }
                      >
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/events/${event.id}/overview`}
                        className="inline-flex items-center rounded-full bg-primary/15 px-2.5 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/25"
                      >
                        Track event
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/events/${event.id}/stages`}
                        className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-sm font-medium text-primary transition-colors hover:bg-accent"
                      >
                        Configure stages
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/events/${event.id}/prizes`}
                        className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-sm font-medium text-primary transition-colors hover:bg-accent"
                      >
                        Configure prizes
                      </Link>
                    </TableCell>
                    <TableCell>
                      {event.winningMode === "JUDGE_SCORE" ? (
                        <Link
                          href={`/admin/events/${event.id}/judges`}
                          className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-sm font-medium text-primary transition-colors hover:bg-accent"
                        >
                          {event.judges.length}/5 judges
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {event.status !== "PUBLISHED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={publishEvent.isPending}
                          onClick={() =>
                            publishEvent.mutate(event.id, {
                              onSuccess: () => toast.success("Event published."),
                              onError: (err) =>
                                toast.error(err instanceof ApiError ? err.message : "Failed to publish."),
                            })
                          }
                        >
                          Publish
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
                      <Button size="sm" variant="outline" aria-label="Duplicate event" onClick={() => handleDuplicate(event)}>
                        <Copy className="size-4" />
                      </Button>
                      {event.status !== "ARCHIVED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={archiveEvent.isPending}
                          onClick={() =>
                            archiveEvent.mutate(event.id, {
                              onSuccess: () => toast.success("Event archived."),
                              onError: (err) =>
                                toast.error(err instanceof ApiError ? err.message : "Failed to archive."),
                            })
                          }
                        >
                          Archive
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={deleteEvent.isPending}
                        aria-label="Delete event"
                        onClick={() =>
                          deleteEvent.mutate(event.id, {
                            onSuccess: () => toast.success("Event deleted."),
                            onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to delete."),
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
