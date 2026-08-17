"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  CalendarRange,
  ChevronDown,
  ExternalLink,
  Flag,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Sun,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { usePendingSubmissions, useAdminReports } from "@/lib/hooks/useAdmin";
import { mediaUrl } from "@/lib/api-client";
import { Brand, BrandMark } from "@/components/shared/Brand";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/organizer", label: "My Events", icon: CalendarRange },
  { href: "/organizer/moderation", label: "Moderation", icon: ShieldCheck },
  { href: "/organizer/reports", label: "Reports", icon: Flag },
];

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { data: pendingSubmissions } = usePendingSubmissions();
  const { data: pendingReports } = useAdminReports("PENDING");
  const pendingCount = pendingSubmissions?.length ?? 0;
  const pendingReportCount = pendingReports?.length ?? 0;
  const notificationCount = pendingCount + pendingReportCount;

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "ORGANIZER")) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, router, pathname]);

  useEffect(() => {
    const stored = localStorage.getItem("admin-theme");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage after mount
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);

  useEffect(() => {
    // Dropdowns/dialogs portal to document.body, outside the themed wrapper div below —
    // mirror the theme class onto <html> too so portaled content inherits the right tokens.
    const root = document.documentElement;
    root.classList.add(theme === "light" ? "admin-light" : "admin-dark");
    root.classList.remove(theme === "light" ? "admin-dark" : "admin-light");
    return () => {
      root.classList.remove("admin-light", "admin-dark");
    };
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("admin-theme", next);
      return next;
    });
  };

  const themeClass = theme === "light" ? "admin-light" : "admin-dark";

  if (isLoading || !user || user.role !== "ORGANIZER") {
    return (
      <div className={cn("flex min-h-screen bg-background", themeClass)}>
        <aside className="flex h-screen w-64 shrink-0 flex-col gap-2 border-r border-sidebar-border bg-sidebar p-4">
          <Skeleton className="mb-4 h-9 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </aside>
        <div className="flex-1 p-8">
          <Skeleton className="mb-2 h-7 w-40" />
          <Skeleton className="mb-6 h-4 w-64" />
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-screen bg-background text-foreground", themeClass)}>
      <aside
        className={cn(
          "sticky top-0 flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200",
          sidebarCollapsed ? "w-[76px]" : "w-64",
        )}
      >
        <Link href="/" className="flex h-[65px] shrink-0 items-center border-b border-sidebar-border px-5">
          {sidebarCollapsed ? <BrandMark /> : <Brand className="text-xl item-left" />}
        </Link>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_LINKS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={sidebarCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2.5 text-sm tracking-wide uppercase transition-all",
                  isActive
                    ? "border-primary bg-gradient-to-r from-primary/15 to-transparent font-medium text-foreground shadow-sm shadow-primary/10"
                    : "text-muted-foreground hover:translate-x-0.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className={cn("size-4.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                <span className={cn(sidebarCollapsed && "hidden")}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/80 px-6 py-3 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSidebarCollapsed((v) => !v)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="size-4.5" /> : <PanelLeftClose className="size-4.5" />}
          </Button>

          <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Organizer dashboard
          </span>

          <div className="flex-1" />

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-primary lg:inline-flex"
          >
            View live site
            <ExternalLink className="size-3.5" />
          </a>

          <Button variant="ghost" size="icon-sm" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Moon className="size-4.5" /> : <Sun className="size-4.5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" className="relative" aria-label="Notifications">
                  <Bell className="size-4.5" />
                  {notificationCount > 0 && <span className="absolute top-1.5 right-1.5 flex size-2 rounded-full bg-primary" />}
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              {notificationCount === 0 ? (
                <p className="px-1.5 py-2 text-sm text-muted-foreground">You&apos;re all caught up.</p>
              ) : (
                <>
                  {pendingCount > 0 && (
                    <DropdownMenuItem render={<Link href="/organizer/moderation" />}>
                      {pendingCount} submission{pendingCount === 1 ? "" : "s"} awaiting moderation
                    </DropdownMenuItem>
                  )}
                  {pendingReportCount > 0 && (
                    <DropdownMenuItem render={<Link href="/organizer/reports" />}>
                      {pendingReportCount} pending report{pendingReportCount === 1 ? "" : "s"}
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors hover:bg-accent">
                  <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/20 text-sm font-semibold text-primary ring-2 ring-primary/20">
                    {mediaUrl(user.avatarKey) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mediaUrl(user.avatarKey)!} alt={user.name} className="size-full object-cover" />
                    ) : (
                      (user.name?.[0]?.toUpperCase() ?? "O")
                    )}
                  </span>
                  <span className="hidden max-w-28 truncate text-sm font-medium text-foreground sm:inline">
                    {user.name}
                  </span>
                  <ChevronDown className="hidden size-3.5 shrink-0 text-muted-foreground sm:inline" />
                </button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{user.email}</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/account" />}>
                <UserRound className="size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => logout().then(() => router.push("/"))}>
                <LogOut className="size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="relative p-8">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(var(--brand-rgb),0.06),_transparent_55%)]" />
          {children}
        </main>
      </div>
    </div>
  );
}
