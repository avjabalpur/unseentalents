"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Flag, History, Star, ThumbsUp } from "lucide-react";
import type { Submission, WinningMode } from "@/types/api";
import { ApiError, mediaUrl } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { useSubmissionHistory } from "@/lib/hooks/useActivity";
import { useCreateReport } from "@/lib/hooks/useReports";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MediaPlayer } from "@/components/shared/MediaPlayer";
import { ActivityTimeline } from "@/components/shared/ActivityTimeline";

const REPORT_REASONS = [
  "Inappropriate content",
  "Copyright violation",
  "Spam",
  "Harassment",
  "Other",
];

function ReportSubmissionSheet({ submissionId }: { submissionId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const createReport = useCreateReport();

  const handleSubmit = () => {
    createReport.mutate(
      { targetType: "SUBMISSION", targetId: submissionId, reason, notes: notes.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Report submitted — thanks for letting us know.");
          setOpen(false);
          setReason("");
          setNotes("");
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to submit report."),
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Report this entry" />}>
        <Flag className="size-4" />
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Report this entry</SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-4">
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={(v) => v && setReason(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Additional details (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
          </div>
        </SheetBody>
        <SheetFooter>
          <Button onClick={handleSubmit} disabled={!reason || createReport.isPending}>
            {createReport.isPending ? "Submitting…" : "Submit report"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

interface SubmissionCardProps {
  submission: Submission;
  rank?: number;
  action?: React.ReactNode;
  winningMode?: WinningMode;
}

export function SubmissionCard({ submission, rank, action, winningMode = "AUDIENCE_VOTE" }: SubmissionCardProps) {
  const { user } = useAuth();
  const [historyOpen, setHistoryOpen] = useState(false);
  const { data: history, isLoading: historyLoading } = useSubmissionHistory(
    historyOpen ? submission.id : undefined,
  );
  const posterUrl = mediaUrl(submission.thumbnailKey);
  const videoUrl = submission.mediaType === "VIDEO" ? mediaUrl(submission.storageKey) : null;
  const imageUrl = submission.mediaType === "IMAGE" ? mediaUrl(submission.storageKey) : null;

  return (
    <Card className="group overflow-hidden py-0 gap-0 border-white/10 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
      <div className="relative aspect-video bg-black">
        {rank !== undefined && (
          <span className="absolute left-2 top-2 z-20 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
            #{rank}
          </span>
        )}
        <MediaPlayer
          mediaType={submission.mediaType}
          videoUrl={videoUrl}
          imageUrl={imageUrl}
          posterUrl={posterUrl}
          alt={submission.title ?? "Submission"}
        />
      </div>
      <CardContent className="pt-3 pb-0">
        <Link
          href={`/submissions/${submission.id}`}
          className="line-clamp-1 font-semibold text-white hover:text-primary"
        >
          {submission.title || "Untitled entry"}
        </Link>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatDate(submission.uploadedAt)}
          {submission.ownerUsername && <> · by @{submission.ownerUsername}</>}
        </p>
        {submission.eventName && (
          <p className="mt-1 truncate text-xs uppercase tracking-wide text-primary/80">{submission.eventName}</p>
        )}
        {submission.notes && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{submission.notes}</p>
        )}
      </CardContent>
      <CardContent className="flex items-center justify-between py-3">
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          {winningMode === "JUDGE_SCORE" ? (
            <>
              <Star className="size-4" />
              {submission.judgeScoreTotal ?? 0} pts ({submission.judgeScores.length} judge
              {submission.judgeScores.length === 1 ? "" : "s"})
            </>
          ) : (
            <>
              <ThumbsUp className="size-4" />
              {submission.voteCount} vote{submission.voteCount === 1 ? "" : "s"}
            </>
          )}
        </span>
        <div className="flex items-center">
          <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="View history">
                  <History className="size-4" />
                </Button>
              }
            />
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Entry history</SheetTitle>
              </SheetHeader>
              <SheetBody>
                <ActivityTimeline logs={history} isLoading={historyLoading} />
              </SheetBody>
            </SheetContent>
          </Sheet>
          {user && <ReportSubmissionSheet submissionId={submission.id} />}
        </div>
      </CardContent>
      {action && <CardFooter className="pb-3">{action}</CardFooter>}
    </Card>
  );
}
