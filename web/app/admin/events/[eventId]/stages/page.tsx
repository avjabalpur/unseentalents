import { StagesAdminClient } from "@/components/admin/StagesAdminClient";

export default async function AdminStagesPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return <StagesAdminClient eventId={eventId} />;
}
