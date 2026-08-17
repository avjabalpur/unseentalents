"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, History } from "lucide-react";
import { useBulkModerateSubmissions, usePendingSubmissions, useModerateSubmission } from "@/lib/hooks/useAdmin";
import { useSubmissionHistory } from "@/lib/hooks/useActivity";
import { ApiError, mediaUrl } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MediaPlayer } from "@/components/shared/MediaPlayer";
import { ActivityTimeline } from "@/components/shared/ActivityTimeline";
import { CardGridSkeleton } from "@/components/admin/CardGridSkeleton";
import { Breadcrumb, type BreadcrumbItem } from "@/components/admin/Breadcrumb";
import { EmptyState } from "@/components/shared/EmptyState";
import { ExportCsvButton } from "@/components/admin/ExportCsvButton";

function HistoryTrigger({ submissionId }: { submissionId: string }) {
  const [open, setOpen] = useState(false);
  const { data: history, isLoading } = useSubmissionHistory(open ? submissionId : undefined);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm" variant="ghost" aria-label="View history" />}>
        <History className="size-4" />
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Entry history</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <ActivityTimeline logs={history} isLoading={isLoading} />
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

function RejectTrigger({ submissionId, disabled }: { submissionId: string; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const moderate = useModerateSubmission();

  const handleReject = () => {
    moderate.mutate(
      { submissionId, approve: false, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Rejected.");
          setOpen(false);
          setReason("");
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed."),
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm" variant="outline" className="flex-1" disabled={disabled} />}>
        Reject
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Reject entry</SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-1.5">
          <Label>Reason (shown to the uploader)</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Doesn't meet the event's content guidelines"
            rows={4}
          />
        </SheetBody>
        <SheetFooter>
          <Button variant="destructive" onClick={handleReject} disabled={moderate.isPending}>
            {moderate.isPending ? "Rejecting…" : "Reject entry"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function BulkRejectTrigger({ submissionIds, onDone }: { submissionIds: string[]; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const bulkModerate = useBulkModerateSubmissions();

  const handleReject = () => {
    bulkModerate.mutate(
      { submissionIds, approve: false, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(`Rejected ${submissionIds.length} entries.`);
          setOpen(false);
          setReason("");
          onDone();
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Bulk reject failed."),
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm" variant="destructive" disabled={submissionIds.length === 0} />}>
        Reject selected
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Reject {submissionIds.length} entries</SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-1.5">
          <Label>Reason (shown to each uploader)</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} />
        </SheetBody>
        <SheetFooter>
          <Button variant="destructive" onClick={handleReject} disabled={bulkModerate.isPending}>
            {bulkModerate.isPending ? "Rejecting…" : "Reject entries"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

const DEFAULT_BREADCRUMB_BASE: BreadcrumbItem[] = [{ label: "Dashboard", href: "/admin" }];

export function ModerationClient({
  breadcrumbBase = DEFAULT_BREADCRUMB_BASE,
  canExport = true,
}: {
  breadcrumbBase?: BreadcrumbItem[];
  canExport?: boolean;
}) {
  const { data: submissions, isLoading } = usePendingSubmissions();
  const moderate = useModerateSubmission();
  const bulkModerate = useBulkModerateSubmissions();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkApprove = () => {
    bulkModerate.mutate(
      { submissionIds: [...selected], approve: true },
      {
        onSuccess: () => {
          toast.success(`Approved ${selected.size} entries.`);
          setSelected(new Set());
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Bulk approve failed."),
      },
    );
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Breadcrumb items={[...breadcrumbBase, { label: "Moderation" }]} />
        {canExport && <ExportCsvButton path="/admin/export/submissions" filename="submissions.csv" label="Export submissions" />}
      </div>

      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-border bg-accent/40 px-3 py-2">
          <span className="text-sm text-muted-foreground">{selected.size} selected</span>
          <Button size="sm" disabled={bulkModerate.isPending} onClick={handleBulkApprove}>
            Approve selected
          </Button>
          <BulkRejectTrigger submissionIds={[...selected]} onDone={() => setSelected(new Set())} />
        </div>
      )}

      {isLoading ? (
        <CardGridSkeleton />
      ) : !submissions || submissions.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="All caught up"
          description="Nothing pending — new submissions will show up here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {submissions.map((submission) => {
            const posterUrl = mediaUrl(submission.thumbnailKey);
            const videoUrl = submission.mediaType === "VIDEO" ? mediaUrl(submission.storageKey) : null;
            const imageUrl = submission.mediaType === "IMAGE" ? mediaUrl(submission.storageKey) : null;
            return (
              <Card key={submission.id} className="gap-0 overflow-hidden py-0 shadow-md shadow-black/20">
                <div className="aspect-video bg-black">
                  <MediaPlayer
                    mediaType={submission.mediaType}
                    videoUrl={videoUrl}
                    imageUrl={imageUrl}
                    posterUrl={posterUrl}
                    alt="Submission"
                  />
                </div>
                <CardHeader className="pt-4">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selected.has(submission.id)}
                        onCheckedChange={() => toggleOne(submission.id)}
                        aria-label="Select entry"
                      />
                      <Badge variant="secondary">{submission.mediaType}</Badge>
                      <Badge variant="outline">{submission.processingStatus}</Badge>
                    </div>
                    <HistoryTrigger submissionId={submission.id} />
                  </CardTitle>
                  {submission.notes && <p className="text-sm text-muted-foreground">{submission.notes}</p>}
                </CardHeader>
                <CardContent className="flex gap-2 pb-4">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={moderate.isPending}
                    onClick={() =>
                      moderate.mutate(
                        { submissionId: submission.id, approve: true },
                        {
                          onSuccess: () => toast.success("Approved."),
                          onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed."),
                        },
                      )
                    }
                  >
                    Approve
                  </Button>
                  <RejectTrigger submissionId={submission.id} disabled={moderate.isPending} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
