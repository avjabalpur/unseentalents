import { StagesAdminClient } from "@/components/admin/StagesAdminClient";
import { PrizesAdminClient } from "@/components/admin/PrizesAdminClient";
import { JudgesAdminClient } from "@/components/admin/JudgesAdminClient";

const BREADCRUMB_BASE = [{ label: "My Events", href: "/organizer" }];

export default async function OrganizerEventManagePage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  return (
    <div className="space-y-10">
      <JudgesAdminClient eventId={eventId} breadcrumbBase={BREADCRUMB_BASE} />
      <StagesAdminClient eventId={eventId} breadcrumbBase={BREADCRUMB_BASE} />
      <PrizesAdminClient eventId={eventId} breadcrumbBase={BREADCRUMB_BASE} />
    </div>
  );
}
