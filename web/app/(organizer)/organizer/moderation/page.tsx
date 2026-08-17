import { ModerationClient } from "@/components/admin/ModerationClient";

const BREADCRUMB_BASE = [{ label: "My Events", href: "/organizer" }];

export default function OrganizerModerationPage() {
  return <ModerationClient breadcrumbBase={BREADCRUMB_BASE} canExport={false} />;
}
