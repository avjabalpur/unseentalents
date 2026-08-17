"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Briefcase, KeyRound, ThumbsUp, User as UserIcon, Video } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const NAV = [
  { href: "/account", label: "Profile", icon: UserIcon },
  { href: "/account/password", label: "Change Password", icon: KeyRound },
  { href: "/account/uploads", label: "My Uploads", icon: Video },
  { href: "/account/votes", label: "My Votes", icon: ThumbsUp },
  { href: "/account/organizer", label: "Become an Organizer", icon: Briefcase },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, router, pathname]);

  if (isLoading || !user) {
    return (
      <div className="mx-auto max-w-[1600px] px-4 py-10">
        <Skeleton className="mb-8 h-8 w-48" />
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-10">
      <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-primary">Welcome back</p>
      <h1 className="font-heading mb-8 text-2xl font-semibold uppercase tracking-wide sm:text-3xl">{user.name}</h1>
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {NAV.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2.5 text-sm uppercase tracking-wide whitespace-nowrap transition-colors",
                  isActive
                    ? "border-primary bg-primary/10 font-medium text-white"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
