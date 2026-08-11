"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useEvents } from "@/lib/hooks/useEvents";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/shared/Brand";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const STATUS_LABELS: Record<string, string> = {
  UPCOMING: "Upcoming",
  ONGOING: "Going on",
};

const linkClass =
  "block rounded-lg px-3 py-2.5 text-sm font-medium uppercase tracking-wide text-white/90 hover:bg-white/5 hover:text-primary";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const { data: events } = useEvents();

  const visibleEvents = (events ?? []).filter(
    (event) => event.computedStatus === "UPCOMING" || event.computedStatus === "ONGOING",
  );

  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="Open menu" />}
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent className="flex flex-col bg-black">
        <SheetHeader>
          <SheetTitle>
            <Brand />
          </SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-1">
          <Link href="/" className={linkClass} onClick={close}>
            Home
          </Link>

          <p className="px-3 pt-3 pb-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Events
          </p>
          <Link href="/events" className={cn(linkClass, "text-primary")} onClick={close}>
            View all events
          </Link>
          {visibleEvents.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-primary"
              onClick={close}
            >
              <span className="truncate">{event.name}</span>
              {event.computedStatus && (
                <span
                  className={cn(
                    "shrink-0 text-xs normal-case",
                    event.computedStatus === "ONGOING" ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {STATUS_LABELS[event.computedStatus]}
                </span>
              )}
            </Link>
          ))}

          <div className="mt-2 border-t border-white/10 pt-2">
            <Link href="/gallery" className={linkClass} onClick={close}>
              Gallery
            </Link>
            <Link href="/pages/whats-new" className={linkClass} onClick={close}>
              What&apos;s New
            </Link>
            <Link href="/pages/about-us" className={linkClass} onClick={close}>
              About Us
            </Link>
            <Link href="/upload" className={linkClass} onClick={close}>
              Upload
            </Link>
          </div>

          <div className="mt-2 border-t border-white/10 pt-2">
            {user ? (
              <>
                <Link href="/account" className={linkClass} onClick={close}>
                  Profile
                </Link>
                <Link href="/account/password" className={linkClass} onClick={close}>
                  Change Password
                </Link>
                <Link href="/account/uploads" className={linkClass} onClick={close}>
                  My Uploads
                </Link>
                <Link href="/account/votes" className={linkClass} onClick={close}>
                  My Votes
                </Link>
                {user.role === "ADMIN" && (
                  <Link href="/admin" className={linkClass} onClick={close}>
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  className={cn(linkClass, "w-full text-left text-red-400 hover:bg-red-500/10 hover:text-red-300")}
                  onClick={async () => {
                    await logout();
                    close();
                    router.push("/");
                  }}
                >
                  Log out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 px-3 pt-1">
                <Button
                  variant="outline"
                  className="uppercase tracking-wide"
                  nativeButton={false}
                  render={
                    <Link href="/login" onClick={close}>
                      Sign in
                    </Link>
                  }
                />
                <Button
                  className="uppercase tracking-wide"
                  nativeButton={false}
                  render={
                    <Link href="/register" onClick={close}>
                      Register now
                    </Link>
                  }
                />
              </div>
            )}
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
