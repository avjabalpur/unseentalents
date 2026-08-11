"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Megaphone, Plus } from "lucide-react";
import {
  useAdminAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  useUpdateAnnouncement,
} from "@/lib/hooks/useAdmin";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import type { Announcement } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import { Breadcrumb } from "@/components/admin/Breadcrumb";
import { EmptyState } from "@/components/shared/EmptyState";

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function AnnouncementForm({
  formId,
  message,
  setMessage,
  buttonLabel,
  setButtonLabel,
  linkUrl,
  setLinkUrl,
  startAt,
  setStartAt,
  endAt,
  setEndAt,
  onSubmit,
}: {
  formId: string;
  message: string;
  setMessage: (v: string) => void;
  buttonLabel: string;
  setButtonLabel: (v: string) => void;
  linkUrl: string;
  setLinkUrl: (v: string) => void;
  startAt: string;
  setStartAt: (v: string) => void;
  endAt: string;
  setEndAt: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
}) {
  return (
    <form id={formId} onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Message</Label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. The Summer Showcase is live — enter before it closes."
          rows={3}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label>Button label (optional)</Label>
        <Input value={buttonLabel} onChange={(e) => setButtonLabel(e.target.value)} placeholder="Check it" />
      </div>
      <div className="space-y-1.5">
        <Label>Redirect to (optional)</Label>
        <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="/events/some-event" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Starts (optional)</Label>
          <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Ends (optional)</Label>
          <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Leave the dates blank to show the announcement indefinitely (until turned off).
      </p>
    </form>
  );
}

function CreateAnnouncementSheet() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [buttonLabel, setButtonLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const createAnnouncement = useCreateAnnouncement();

  const reset = () => {
    setMessage("");
    setButtonLabel("");
    setLinkUrl("");
    setStartAt("");
    setEndAt("");
  };

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    createAnnouncement.mutate(
      {
        message: message.trim(),
        buttonLabel: buttonLabel.trim() || undefined,
        linkUrl: linkUrl.trim() || undefined,
        startAt: startAt ? new Date(startAt).toISOString() : undefined,
        endAt: endAt ? new Date(endAt).toISOString() : undefined,
        active: true,
      },
      {
        onSuccess: () => {
          toast.success("Announcement created.");
          reset();
          setOpen(false);
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to create announcement."),
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm" />}>
        <Plus className="size-4" />
        Add announcement
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create announcement</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <AnnouncementForm
            formId="create-announcement-form"
            message={message}
            setMessage={setMessage}
            buttonLabel={buttonLabel}
            setButtonLabel={setButtonLabel}
            linkUrl={linkUrl}
            setLinkUrl={setLinkUrl}
            startAt={startAt}
            setStartAt={setStartAt}
            endAt={endAt}
            setEndAt={setEndAt}
            onSubmit={handleCreate}
          />
        </SheetBody>
        <SheetFooter>
          <Button type="submit" form="create-announcement-form" disabled={createAnnouncement.isPending || !message.trim()}>
            {createAnnouncement.isPending ? "Creating…" : "Create announcement"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function EditAnnouncementSheet({ announcement }: { announcement: Announcement }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(announcement.message);
  const [buttonLabel, setButtonLabel] = useState(announcement.buttonLabel ?? "");
  const [linkUrl, setLinkUrl] = useState(announcement.linkUrl ?? "");
  const [startAt, setStartAt] = useState(toDatetimeLocalValue(announcement.startAt));
  const [endAt, setEndAt] = useState(toDatetimeLocalValue(announcement.endAt));
  const updateAnnouncement = useUpdateAnnouncement();

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    updateAnnouncement.mutate(
      {
        announcementId: announcement.id,
        message: message.trim(),
        buttonLabel: buttonLabel.trim() || null,
        linkUrl: linkUrl.trim() || null,
        startAt: startAt ? new Date(startAt).toISOString() : null,
        endAt: endAt ? new Date(endAt).toISOString() : null,
      },
      {
        onSuccess: () => {
          toast.success("Announcement updated.");
          setOpen(false);
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to update announcement."),
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm" variant="outline" />}>Edit</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit announcement</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <AnnouncementForm
            formId="edit-announcement-form"
            message={message}
            setMessage={setMessage}
            buttonLabel={buttonLabel}
            setButtonLabel={setButtonLabel}
            linkUrl={linkUrl}
            setLinkUrl={setLinkUrl}
            startAt={startAt}
            setStartAt={setStartAt}
            endAt={endAt}
            setEndAt={setEndAt}
            onSubmit={handleSave}
          />
        </SheetBody>
        <SheetFooter>
          <Button type="submit" form="edit-announcement-form" disabled={updateAnnouncement.isPending || !message.trim()}>
            {updateAnnouncement.isPending ? "Saving…" : "Save changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default function AdminAnnouncementsPage() {
  const { data: announcements, isLoading } = useAdminAnnouncements();
  const updateAnnouncement = useUpdateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <Breadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Announcements" }]} />
        <CreateAnnouncementSheet />
      </div>

      <Card className="shadow-md shadow-black/20">
        <CardHeader>
          <CardTitle>All announcements</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton columns={6} />
          ) : !announcements || announcements.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="No announcements yet"
              description="Add one to show a banner at the top of the site."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Message</TableHead>
                  <TableHead>Redirects to</TableHead>
                  <TableHead>Starts</TableHead>
                  <TableHead>Ends</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="max-w-xs truncate font-medium">{a.message}</TableCell>
                    <TableCell className="max-w-40 truncate text-sm text-muted-foreground">
                      {a.linkUrl || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {a.startAt ? formatDate(a.startAt) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {a.endAt ? formatDate(a.endAt) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.active ? "default" : "secondary"}>{a.active ? "Active" : "Off"}</Badge>
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
                      <EditAnnouncementSheet announcement={a} />
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updateAnnouncement.isPending}
                        onClick={() =>
                          updateAnnouncement.mutate(
                            { announcementId: a.id, active: !a.active },
                            {
                              onError: (err) =>
                                toast.error(err instanceof ApiError ? err.message : "Failed to update."),
                            },
                          )
                        }
                      >
                        {a.active ? "Turn off" : "Turn on"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={deleteAnnouncement.isPending}
                        onClick={() =>
                          deleteAnnouncement.mutate(a.id, {
                            onSuccess: () => toast.success("Announcement deleted."),
                            onError: (err) =>
                              toast.error(err instanceof ApiError ? err.message : "Failed to delete."),
                          })
                        }
                      >
                        Delete
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
