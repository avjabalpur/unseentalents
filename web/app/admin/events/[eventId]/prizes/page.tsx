import { PrizesAdminClient } from "@/components/admin/PrizesAdminClient";

export default async function AdminPrizesPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return <PrizesAdminClient eventId={eventId} />;
}
