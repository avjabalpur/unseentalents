import { ReportsClient } from "@/components/admin/ReportsClient";

const BREADCRUMB_BASE = [{ label: "My Events", href: "/organizer" }];

export default function OrganizerReportsPage() {
  return <ReportsClient breadcrumbBase={BREADCRUMB_BASE} />;
}
