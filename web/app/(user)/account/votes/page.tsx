"use client";

import { useMyVotes } from "@/lib/hooks/useSubmissions";
import { SubmissionCard } from "@/components/shared/SubmissionCard";
import { SubmissionGridSkeleton } from "@/components/shared/SubmissionCardSkeleton";

export default function MyVotesPage() {
  const { data: submissions, isLoading } = useMyVotes(true);

  if (isLoading) return <SubmissionGridSkeleton count={6} />;

  if (!submissions || submissions.length === 0) {
    return <p className="text-muted-foreground">You haven&apos;t voted for anything yet.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {submissions.map((submission) => (
        <SubmissionCard key={submission.id} submission={submission} />
      ))}
    </div>
  );
}
