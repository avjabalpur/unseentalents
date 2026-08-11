import { EventOverviewAdminClient } from "@/components/admin/EventOverviewAdminClient";

export default async function AdminEventOverviewPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return <EventOverviewAdminClient eventId={eventId} />;
}
