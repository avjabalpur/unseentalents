import { notFound } from "next/navigation";
import { API_BASE_URL } from "@/lib/api-client";
import type { Submission } from "@/types/api";
import { SubmissionDetailClient } from "@/components/user/SubmissionDetailClient";

async function getSubmission(id: string): Promise<Submission | null> {
  const res = await fetch(`${API_BASE_URL}/api/v1/submissions/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as Submission;
}

export default async function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const submission = await getSubmission(id);
  if (!submission) notFound();

  return <SubmissionDetailClient submission={submission} />;
}
