"use client";

import Link from "next/link";
import { useActiveAnnouncement } from "@/lib/hooks/useAnnouncements";
import { cn } from "@/lib/utils";

export function AnnouncementBar() {
  const { data: announcement } = useActiveAnnouncement();
  if (!announcement) return null;

  const content = (
    <>
      <span>{announcement.message}</span>
      {announcement.linkUrl && announcement.buttonLabel && (
        <span className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tracking-wide uppercase">
          {announcement.buttonLabel}
        </span>
      )}
    </>
  );

  const className =
    "flex flex-wrap items-center justify-center gap-3 bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground";

  if (!announcement.linkUrl) {
    return <div className={className}>{content}</div>;
  }

  const isExternal = /^https?:\/\//.test(announcement.linkUrl);
  const linkClassName = cn(className, "cursor-pointer transition-colors hover:bg-primary/90");

  if (isExternal) {
    return (
      <a href={announcement.linkUrl} target="_blank" rel="noopener noreferrer" className={linkClassName}>
        {content}
      </a>
    );
  }

  return (
    <Link href={announcement.linkUrl} className={linkClassName}>
      {content}
    </Link>
  );
}
