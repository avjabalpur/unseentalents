"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  CalendarRange,
  ExternalLink,
  FileText,
  GalleryHorizontal,
  LayoutDashboard,
  Mail,
  ShieldCheck,
  Tags,
  Ticket,
  Users as UsersIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/event-types", label: "Event Types", icon: Tags },
  { href: "/admin/events", label: "Events", icon: CalendarRange },
  { href: "/admin/moderation", label: "Moderation", icon: ShieldCheck },
  { href: "/admin/topics", label: "Topics", icon: FileText },
  { href: "/admin/slides", label: "Hero Slider", icon: GalleryHorizontal },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/users", label: "Users", icon: UsersIcon },
  { href: "/admin/contact", label: "Contact Messages", icon: Mail },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "ADMIN")) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, router, pathname]);

  if (isLoading || !user || user.role !== "ADMIN") {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-black">
        <Link href="/" className="flex items-center border-b border-white/10 px-5 py-5">
          <Image src="/unseentalents-logo.jpg" alt="Unseen Talents" width={150} height={50} className="h-9 w-auto" />
        </Link>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2.5 text-sm uppercase tracking-wide transition-colors",
                  isActive
                    ? "border-primary bg-primary/10 font-medium text-white"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className={cn("size-4.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
              {user.name?.[0]?.toUpperCase() ?? "A"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => logout().then(() => router.push("/"))}
          >
            Log out
          </Button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-end border-b border-white/10 bg-black/40 px-8 py-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            View live site
            <ExternalLink className="size-3.5" />
          </a>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
