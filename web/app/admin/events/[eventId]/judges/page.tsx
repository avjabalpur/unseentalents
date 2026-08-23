import { JudgesAdminClient } from "@/components/admin/JudgesAdminClient";

export default async function AdminJudgesPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return <JudgesAdminClient eventId={eventId} />;
}
