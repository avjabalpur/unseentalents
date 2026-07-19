import { Badge } from "@/components/ui/badge";
import type { ComputedEventStatus } from "@/types/api";

const STYLES: Record<ComputedEventStatus, string> = {
  UPCOMING: "bg-white/10 text-white",
  ONGOING: "bg-primary text-primary-foreground",
  CLOSED: "bg-white/5 text-muted-foreground",
};

const LABELS: Record<ComputedEventStatus, string> = {
  UPCOMING: "Upcoming",
  ONGOING: "Live now",
  CLOSED: "Closed",
};

export function EventStatusBadge({ status }: { status: ComputedEventStatus }) {
  return (
    <Badge variant="secondary" className={STYLES[status]}>
      {LABELS[status]}
    </Badge>
  );
}
