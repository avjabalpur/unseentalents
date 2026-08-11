"use client";

import { Video } from "lucide-react";
import { useMySubmissions } from "@/lib/hooks/useSubmissions";
import { SubmissionCard } from "@/components/shared/SubmissionCard";
import { SubmissionGridSkeleton } from "@/components/shared/SubmissionCardSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";

export default function MyUploadsPage() {
  const { data: submissions, isLoading } = useMySubmissions(true);

  return (
    <div>
      <h2 className="font-heading mb-5 text-lg font-semibold uppercase tracking-wide">My uploads</h2>
      {isLoading ? (
        <SubmissionGridSkeleton count={6} />
      ) : !submissions || submissions.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No uploads yet"
          description="Enter a competition and upload your first video or photo to see it here."
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
