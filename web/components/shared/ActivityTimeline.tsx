import {
  Ban,
  CheckCircle2,
  Clock,
  Coins,
  Image as ImageIcon,
  ShieldCheck,
  TrendingUp,
  Trophy,
  Upload,
  UserCog,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { ActivityLog } from "@/types/api";
import { formatRelativeTime } from "@/lib/format";

const ACTION_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  THUMBNAIL_READY: "Thumbnail generated",
  THUMBNAIL_FAILED: "Thumbnail generation failed",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  ADVANCED_STAGE: "Advanced to next stage",
  ELIMINATED: "Eliminated",
  WON: "Won the event",
  BLOCKED: "Account blocked",
  UNBLOCKED: "Account unblocked",
  CREDIT_GRANTED: "Credits granted",
  ROLE_CHANGED: "Role changed",
  COUPON_UPDATED: "Coupon updated",
};

const ACTION_ICONS: Record<string, LucideIcon> = {
  SUBMITTED: Upload,
  THUMBNAIL_READY: ImageIcon,
  THUMBNAIL_FAILED: ImageIcon,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
  ADVANCED_STAGE: TrendingUp,
  ELIMINATED: XCircle,
  WON: Trophy,
  BLOCKED: Ban,
  UNBLOCKED: ShieldCheck,
  CREDIT_GRANTED: Coins,
  ROLE_CHANGED: UserCog,
};

export function ActivityTimeline({ logs, isLoading }: { logs?: ActivityLog[]; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-accent" />
        ))}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }

  return (
    <ol className="space-y-4">
      {logs.map((log) => {
        const Icon = ACTION_ICONS[log.action] ?? Clock;
        const label = ACTION_LABELS[log.action] ?? log.action;
        const reason = typeof log.logMetadata?.reason === "string" ? log.logMetadata.reason : null;
        const stage = typeof log.logMetadata?.stage === "string" ? log.logMetadata.stage : null;
        return (
          <li key={log.id} className="flex gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-muted-foreground">
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1 pb-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <p className="text-sm font-medium text-foreground">
                  {label}
                  {stage && <span className="font-normal text-muted-foreground"> · {stage.replace(/_/g, " ")}</span>}
                </p>
                <time
                  className="shrink-0 text-xs text-muted-foreground"
                  title={new Date(log.createdAt).toLocaleString()}
                >
                  {formatRelativeTime(log.createdAt)}
                </time>
              </div>
              {(log.actorName || reason) && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {log.actorName && <>by {log.actorName}</>}
                  {log.actorName && reason && " — "}
                  {reason}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
