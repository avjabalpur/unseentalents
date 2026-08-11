"use client";

import { ThumbsUp } from "lucide-react";
import { useMyVotes } from "@/lib/hooks/useSubmissions";
import { SubmissionCard } from "@/components/shared/SubmissionCard";
import { SubmissionGridSkeleton } from "@/components/shared/SubmissionCardSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";

export default function MyVotesPage() {
  const { data: submissions, isLoading } = useMyVotes(true);

  return (
    <div>
      <h2 className="font-heading mb-5 text-lg font-semibold uppercase tracking-wide">My votes</h2>
      {isLoading ? (
        <SubmissionGridSkeleton count={6} />
      ) : !submissions || submissions.length === 0 ? (
        <EmptyState
          icon={ThumbsUp}
          title="No votes yet"
          description="Entries you vote for will show up here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {submissions.map((submission) => (
            <SubmissionCard key={submission.id} submission={submission} />
          ))}
        </div>
      )}
    </div>
  );
}
