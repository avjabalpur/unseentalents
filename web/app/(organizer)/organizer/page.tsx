"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CalendarRange, Plus } from "lucide-react";
import { useMyEvents } from "@/lib/hooks/useEvents";
import { useCreateEvent } from "@/lib/hooks/useAdmin";
import { useEventTypes } from "@/lib/hooks/useEventTypes";
import { ApiError } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import type { EventStatus } from "@/types/api";

const STATUS_BADGE: Record<EventStatus, "default" | "secondary" | "outline"> = {
  DRAFT: "secondary",
  PENDING_REVIEW: "outline",
  PUBLISHED: "default",
  ARCHIVED: "secondary",
};

export default function OrganizerEventsPage() {
  const { data: events, isLoading } = useMyEvents();
  const { data: eventTypes } = useEventTypes();
  const createEvent = useCreateEvent();

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eventTypeId, setEventTypeId] = useState<string>("");

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!eventTypeId) {
      toast.error("Pick an event type first.");
      return;
    }
    createEvent.mutate(
      { name, description, eventTypeId },
      {
        onSuccess: () => {
          toast.success("Event submitted — it needs admin review before it goes live.");
          setName("");
          setDescription("");
          setEventTypeId("");
          setFormOpen(false);
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to create event."),
      },
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide">My Events</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Newly created events need admin review before they&apos;re published.
          </p>
        </div>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          Create event
        </Button>
      </div>

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Create event</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <form id="create-organizer-event-form" onSubmit={handleCreate} className="space-y-4">
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
            </form>
          </SheetBody>
          <SheetFooter>
            <Button type="submit" form="create-organizer-event-form" disabled={createEvent.isPending}>
              {createEvent.isPending ? "Creating…" : "Create event"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Card className="shadow-md shadow-black/20">
        <CardHeader>
          <CardTitle>Your events</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton columns={3} />
          ) : !events || events.length === 0 ? (
            <EmptyState icon={CalendarRange} title="No events yet" description="Use “Create event” to get started." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE[event.status]}>{event.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/organizer/events/${event.id}`}
                        className="inline-flex items-center rounded-full bg-primary/15 px-2.5 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/25"
                      >
                        Manage
                      </Link>
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
