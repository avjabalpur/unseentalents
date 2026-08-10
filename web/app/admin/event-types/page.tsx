"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useEventTypes } from "@/lib/hooks/useEventTypes";
import { useCreateEventType, useUploadEventTypeImage } from "@/lib/hooks/useAdmin";
import { ApiError, mediaUrl } from "@/lib/api-client";
import type { MediaType } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CollapsibleFormCard } from "@/components/admin/CollapsibleFormCard";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import { Breadcrumb } from "@/components/admin/Breadcrumb";

export default function AdminEventTypesPage() {
  const { data: eventTypes, isLoading } = useEventTypes();
  const createEventType = useCreateEventType();
  const uploadImage = useUploadEventTypeImage();

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("VIDEO");

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    createEventType.mutate(
      { name, description, submissionMediaType: mediaType },
      {
        onSuccess: () => {
          toast.success("Event type created.");
          setName("");
          setDescription("");
          setFormOpen(false);
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to create event type."),
      },
    );
  };

  const handleImageChange = (eventTypeId: string, file: File | null) => {
    if (!file) return;
    uploadImage.mutate(
      { eventTypeId, file },
      {
        onSuccess: () => toast.success("Image uploaded."),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Image upload failed."),
      },
    );
  };

  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Event Types" }]} />

      <CollapsibleFormCard
        title="Create event type"
        triggerLabel="Add event type"
        open={formOpen}
        onOpenChange={setFormOpen}
      >
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Submission type</Label>
            <Select value={mediaType} onValueChange={(v) => v && setMediaType(v as MediaType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIDEO">Video</SelectItem>
                <SelectItem value="IMAGE">Image</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <Button type="submit" className="sm:col-span-2 sm:w-fit" disabled={createEventType.isPending}>
            {createEventType.isPending ? "Creating…" : "Create event type"}
          </Button>
        </form>
      </CollapsibleFormCard>

      <Card className="shadow-md shadow-black/20">
        <CardHeader>
          <CardTitle>All event types</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton columns={4} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Submission type</TableHead>
                  <TableHead>Upload cover image</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventTypes?.map((et) => {
                  const imageUrl = mediaUrl(et.imageKey);
                  return (
                    <TableRow key={et.id}>
                      <TableCell>
                        {imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imageUrl} alt={et.name} className="h-10 w-10 rounded object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{et.name}</TableCell>
                      <TableCell>{et.submissionMediaType}</TableCell>
                      <TableCell>
                        <Input
                          type="file"
                          accept="image/*"
                          className="max-w-56"
                          onChange={(e) => handleImageChange(et.id, e.target.files?.[0] ?? null)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
