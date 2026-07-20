"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAdminEvents, useCreateEvent, usePublishEvent } from "@/lib/hooks/useAdmin";
import { useEventTypes } from "@/lib/hooks/useEventTypes";
import { ApiError } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CollapsibleFormCard } from "@/components/admin/CollapsibleFormCard";
import { TableSkeleton } from "@/components/admin/TableSkeleton";

export default function AdminEventsPage() {
  const { data: events, isLoading } = useAdminEvents();
  const { data: eventTypes } = useEventTypes();
  const createEvent = useCreateEvent();
  const publishEvent = usePublishEvent();

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
      <h1 className="text-2xl font-semibold">Events</h1>

      <CollapsibleFormCard title="Create event" triggerLabel="Add event" open={formOpen} onOpenChange={setFormOpen}>
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
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
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <Button type="submit" className="sm:col-span-2 sm:w-fit" disabled={createEvent.isPending}>
            {createEvent.isPending ? "Creating…" : "Create event"}
          </Button>
        </form>
      </CollapsibleFormCard>

      <Card>
        <CardHeader>
          <CardTitle>All events</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton columns={5} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stages</TableHead>
                  <TableHead>Prizes</TableHead>
                  <TableHead>Publish</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events?.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>
                      <Badge variant={event.status === "PUBLISHED" ? "default" : "secondary"}>
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/events/${event.id}/stages`}
                        className="text-sm font-medium underline underline-offset-4"
                      >
                        Configure stages
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/events/${event.id}/prizes`}
                        className="text-sm font-medium underline underline-offset-4"
                      >
                        Configure prizes
                      </Link>
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
