import { QrCodeClient } from "@/components/admin/QrCodeClient";

const BREADCRUMB_BASE = [{ label: "My Events", href: "/organizer" }];

export default function OrganizerQrCodePage() {
  return <QrCodeClient breadcrumbBase={BREADCRUMB_BASE} />;
}
