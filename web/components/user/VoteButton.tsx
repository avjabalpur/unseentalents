"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ThumbsUp } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useCastVote } from "@/lib/hooks/useSubmissions";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function VoteButton({
  stageId,
  submissionId,
  className,
}: {
  stageId: string;
  submissionId: string;
  className?: string;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const castVote = useCastVote(stageId);

  const handleClick = () => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    castVote.mutate(submissionId, {
      onSuccess: () => toast.success("Vote cast!"),
      onError: (err) => {
        const message = err instanceof ApiError ? err.message : "Something went wrong.";
        toast.error(message);
      },
    });
  };

  return (
    <Button size="sm" className={cn("w-full gap-1.5", className)} onClick={handleClick} disabled={castVote.isPending}>
      <ThumbsUp className="size-4" />
      Vote
    </Button>
  );
}
