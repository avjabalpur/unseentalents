"use client";

import { toast } from "sonner";
import { usePendingSubmissions, useModerateSubmission } from "@/lib/hooks/useAdmin";
import { ApiError, mediaUrl } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MediaPlayer } from "@/components/shared/MediaPlayer";

export default function AdminModerationPage() {
  const { data: submissions, isLoading } = usePendingSubmissions();
  const moderate = useModerateSubmission();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Moderation queue</h1>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !submissions || submissions.length === 0 ? (
        <p className="text-muted-foreground">Nothing pending — you&apos;re all caught up.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {submissions.map((submission) => {
            const posterUrl = mediaUrl(submission.thumbnailKey);
            const videoUrl = submission.mediaType === "VIDEO" ? mediaUrl(submission.storageKey) : null;
            const imageUrl = submission.mediaType === "IMAGE" ? mediaUrl(submission.storageKey) : null;
            return (
              <Card key={submission.id} className="overflow-hidden py-0 gap-0">
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
                    <Badge variant="secondary">{submission.mediaType}</Badge>
                    <Badge variant="outline">{submission.processingStatus}</Badge>
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
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={moderate.isPending}
                    onClick={() =>
                      moderate.mutate(
                        { submissionId: submission.id, approve: false },
                        {
                          onSuccess: () => toast.success("Rejected."),
                          onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed."),
                        },
                      )
                    }
                  >
                    Reject
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
