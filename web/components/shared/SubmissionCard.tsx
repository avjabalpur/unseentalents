import Link from "next/link";
import { ThumbsUp } from "lucide-react";
import type { Submission } from "@/types/api";
import { mediaUrl } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { MediaPlayer } from "@/components/shared/MediaPlayer";

interface SubmissionCardProps {
  submission: Submission;
  rank?: number;
  action?: React.ReactNode;
}

export function SubmissionCard({ submission, rank, action }: SubmissionCardProps) {
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
          <ThumbsUp className="size-4" />
          {submission.voteCount} vote{submission.voteCount === 1 ? "" : "s"}
        </span>
      </CardContent>
      {action && <CardFooter className="pb-3">{action}</CardFooter>}
    </Card>
  );
}
