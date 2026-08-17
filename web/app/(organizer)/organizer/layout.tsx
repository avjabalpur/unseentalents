"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarRange } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Brand } from "@/components/shared/Brand";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "ORGANIZER")) {
      router.replace("/account/organizer");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || user.role !== "ORGANIZER") {
    return (
      <div className="mx-auto max-w-[1600px] px-4 py-10">
        <Skeleton className="mb-8 h-8 w-48" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div>
      <header className="border-b border-border bg-card/40">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4">
          <Link href="/organizer" className="flex items-center gap-2">
            <Brand />
            <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Organizer</span>
          </Link>
          <nav>
            <Link
              href="/organizer"
              className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-foreground hover:text-primary"
            >
              <CalendarRange className="size-4" />
              My Events
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] px-4 py-10">{children}</main>
    </div>
  );
}
