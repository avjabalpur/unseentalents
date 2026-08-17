import { StagesAdminClient } from "@/components/admin/StagesAdminClient";
import { PrizesAdminClient } from "@/components/admin/PrizesAdminClient";

const BREADCRUMB_BASE = [{ label: "My Events", href: "/organizer" }];

export default async function OrganizerEventManagePage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  return (
    <div className="space-y-10">
      <StagesAdminClient eventId={eventId} breadcrumbBase={BREADCRUMB_BASE} />
      <PrizesAdminClient eventId={eventId} breadcrumbBase={BREADCRUMB_BASE} />
    </div>
  );
}
