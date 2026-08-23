"use client";

import { use, useState } from "react";
import { toast } from "sonner";
import { Gavel, Star } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useEvent } from "@/lib/hooks/useEvents";
import { useStageSubmissions } from "@/lib/hooks/useSubmissions";
import { useSubmitJudgeScore } from "@/lib/hooks/useJudgeScores";
import { ApiError, mediaUrl } from "@/lib/api-client";
import type { Submission } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/admin/Breadcrumb";
import { EmptyState } from "@/components/shared/EmptyState";
import { MediaPlayer } from "@/components/shared/MediaPlayer";

function findActiveStage(stages: { id: string; startAt: string; endAt: string; name: string }[]) {
  const now = new Date();
  return stages.find((s) => new Date(s.startAt) <= now && now <= new Date(s.endAt)) ?? null;
}

function ScoreCard({ submission, stageId }: { submission: Submission; stageId: string }) {
  const { user } = useAuth();
  const myExisting = submission.judgeScores.find((s) => s.judgeId === user?.id);
  const [score, setScore] = useState(myExisting?.score ?? 5);
  const [comment, setComment] = useState(myExisting?.comment ?? "");
  const submitScore = useSubmitJudgeScore(stageId);

  const posterUrl = mediaUrl(submission.thumbnailKey);
  const videoUrl = submission.mediaType === "VIDEO" ? mediaUrl(submission.storageKey) : null;
  const imageUrl = submission.mediaType === "IMAGE" ? mediaUrl(submission.storageKey) : null;

  const handleSubmit = () => {
    submitScore.mutate(
      { submissionId: submission.id, score, comment: comment.trim() || undefined },
      {
        onSuccess: () => toast.success(myExisting ? "Score updated." : "Score submitted."),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to submit score."),
      },
    );
  };

  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-md shadow-black/20">
      <div className="aspect-video bg-black">
        <MediaPlayer mediaType={submission.mediaType} videoUrl={videoUrl} imageUrl={imageUrl} posterUrl={posterUrl} alt="Entry" />
      </div>
      <CardHeader className="pt-4">
        <CardTitle className="text-sm">{submission.title || "Untitled entry"}</CardTitle>
        <p className="text-xs text-muted-foreground">by @{submission.ownerUsername}</p>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        <div className="flex items-center gap-3">
          <Label className="shrink-0">Score (1–10)</Label>
          <Input
            type="number"
            min={1}
            max={10}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-20"
          />
          {myExisting && (
            <Badge variant="secondary" className="ml-auto">
              <Star className="size-3" /> Scored
            </Badge>
          )}
        </div>
        <Textarea
          placeholder="Comment (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
        />
        <Button size="sm" className="w-full" disabled={submitScore.isPending} onClick={handleSubmit}>
          {submitScore.isPending ? "Saving…" : myExisting ? "Update score" : "Submit score"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function JudgeEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { data: event } = useEvent(eventId);
  const activeStage = event ? findActiveStage(event.stages) : null;
  const { data: submissions, isLoading } = useStageSubmissions(activeStage?.id);

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[{ label: "My Judging", href: "/account/judging" }, { label: event?.name ?? "Event" }]}
      />

      {!event ? null : !activeStage ? (
        <EmptyState icon={Gavel} title="No active stage" description="Check back when the next round opens for judging." />
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading entries…</p>
      ) : !submissions || submissions.length === 0 ? (
        <EmptyState icon={Gavel} title="No entries yet" description="Approved entries for this round will show up here." />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Scoring {activeStage.name.replace("_", " ")} — {submissions.length} entr
            {submissions.length === 1 ? "y" : "ies"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {submissions.map((submission) => (
              <ScoreCard key={submission.id} submission={submission} stageId={activeStage.id} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
