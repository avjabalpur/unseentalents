"use client";

import { ThumbsUp } from "lucide-react";
import { mediaUrl } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import type { Submission } from "@/types/api";
import { useSubmission } from "@/lib/hooks/useSubmissions";
import { MediaPlayer } from "@/components/shared/MediaPlayer";
import { VoteButton } from "@/components/user/VoteButton";
import { CommentSection } from "@/components/user/CommentSection";

export function SubmissionDetailClient({ submission: initialSubmission }: { submission: Submission }) {
  const { data } = useSubmission(initialSubmission.id, initialSubmission);
  const submission = data ?? initialSubmission;
  const posterUrl = mediaUrl(submission.thumbnailKey);
  const videoUrl = submission.mediaType === "VIDEO" ? mediaUrl(submission.storageKey) : null;
  const imageUrl = submission.mediaType === "IMAGE" ? mediaUrl(submission.storageKey) : null;

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div>
          <div className="overflow-hidden rounded-lg border border-white/10 bg-black">
            <div className="aspect-video">
              <MediaPlayer
                mediaType={submission.mediaType}
                videoUrl={videoUrl}
                imageUrl={imageUrl}
                posterUrl={posterUrl}
                alt={submission.title ?? "Submission"}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                {submission.title || "Untitled entry"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Uploaded {formatDate(submission.uploadedAt)}
                {submission.ownerUsername && (
                  <>
                    {" "}
                    by <span className="text-primary">@{submission.ownerUsername}</span>
                  </>
                )}
              </p>
            </div>
            <VoteButton stageId={submission.stageId} submissionId={submission.id} className="w-auto" />
          </div>

          {submission.notes && <p className="mt-4 text-white/80">{submission.notes}</p>}

          <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <ThumbsUp className="size-4" />
            {submission.voteCount} vote{submission.voteCount === 1 ? "" : "s"}
          </p>
        </div>

        <div className="border-t border-white/10 pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
          <CommentSection submissionId={submission.id} />
        </div>
      </div>
    </div>
  );
}
