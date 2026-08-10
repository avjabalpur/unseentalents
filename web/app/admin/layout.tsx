"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Bell,
  CalendarRange,
  ChevronDown,
  ExternalLink,
  FileText,
  Flag,
  GalleryHorizontal,
  LayoutDashboard,
  LogOut,
  Mail,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Tags,
  Ticket,
  UserRound,
  Users as UsersIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { usePendingSubmissions, useAdminContactMessages, useAdminReports } from "@/lib/hooks/useAdmin";
import { mediaUrl } from "@/lib/api-client";
import { Brand, BrandMark } from "@/components/shared/Brand";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleTrigger, CollapsiblePanel } from "@/components/ui/collapsible";
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
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { href: "/admin/event-types", label: "Event Types", icon: Tags, adminOnly: true },
  { href: "/admin/events", label: "Events", icon: CalendarRange, adminOnly: true },
  { href: "/admin/moderation", label: "Moderation", icon: ShieldCheck, adminOnly: false },
  { href: "/admin/reports", label: "Reports", icon: Flag, adminOnly: false },
  { href: "/admin/users", label: "Users", icon: UsersIcon, adminOnly: true },
];

const CONFIG_LINKS = [
  { href: "/admin/topics", label: "Topics", icon: FileText, adminOnly: true },
  { href: "/admin/slides", label: "Hero Slider", icon: GalleryHorizontal, adminOnly: true },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket, adminOnly: true },
  { href: "/admin/contact", label: "Contact Messages", icon: Mail, adminOnly: true },
  { href: "/admin/activity", label: "Activity", icon: Activity, adminOnly: true },
  { href: "/admin/settings", label: "Settings", icon: Settings, adminOnly: true },
];

const ALL_NAV_ITEMS = [...NAV_LINKS, ...CONFIG_LINKS];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === "ADMIN";
  const hasAdminAccess = user?.role === "ADMIN" || user?.role === "MODERATOR";
  const visibleNavLinks = NAV_LINKS.filter((l) => !l.adminOnly || isAdmin);
  const visibleConfigLinks = CONFIG_LINKS.filter((l) => !l.adminOnly || isAdmin);

  const { data: pendingSubmissions } = usePendingSubmissions();
  const { data: contactMessages } = useAdminContactMessages(isAdmin);
  const { data: pendingReports } = useAdminReports("PENDING");
  const pendingCount = pendingSubmissions?.length ?? 0;
  const unreadContactCount = contactMessages?.filter((m) => !m.isRead).length ?? 0;
  const pendingReportCount = pendingReports?.length ?? 0;
  const notificationCount = pendingCount + unreadContactCount + pendingReportCount;

  useEffect(() => {
    if (!isLoading && (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR"))) {
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- auto-expand the group containing the active route
    if (CONFIG_LINKS.some((l) => pathname === l.href)) setConfigOpen(true);
  }, [pathname]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("admin-theme", next);
      return next;
    });
  };

  const query = search.trim().toLowerCase();
  const searchResults = query ? ALL_NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(query)) : [];

  const goToResult = (href: string) => {
    setSearch("");
    setSearchOpen(false);
    router.push(href);
  };

  const themeClass = theme === "light" ? "admin-light" : "admin-dark";

  if (isLoading || !user || !hasAdminAccess) {
    return (
      <div className={cn("flex min-h-screen bg-background", themeClass)}>
        <aside className="flex h-screen w-64 shrink-0 flex-col gap-2 border-r border-sidebar-border bg-sidebar p-4">
          <Skeleton className="mb-4 h-9 w-32" />
          {Array.from({ length: 9 }).map((_, i) => (
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
          {visibleNavLinks.map((item) => {
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

          {visibleConfigLinks.length > 0 && (
            <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
              <CollapsibleTrigger
                render={
                  <button
                    type="button"
                    title={sidebarCollapsed ? "Configuration" : undefined}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2.5 text-sm tracking-wide uppercase transition-all",
                      visibleConfigLinks.some((l) => pathname === l.href)
                        ? "font-medium text-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Settings className="size-4.5 shrink-0 text-muted-foreground" />
                    <span className={cn("flex-1 text-left", sidebarCollapsed && "hidden")}>Configuration</span>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform",
                        configOpen && "rotate-180",
                        sidebarCollapsed && "hidden",
                      )}
                    />
                  </button>
                }
              />
              <CollapsiblePanel>
                <div className={cn("space-y-1 pt-1", !sidebarCollapsed && "pl-5")}>
                  {visibleConfigLinks.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={sidebarCollapsed ? item.label : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2 text-sm tracking-wide uppercase transition-all",
                          isActive
                            ? "border-primary bg-gradient-to-r from-primary/15 to-transparent font-medium text-foreground"
                            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        )}
                      >
                        <Icon className={cn("size-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                        <span className={cn(sidebarCollapsed && "hidden")}>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </CollapsiblePanel>
            </Collapsible>
          )}
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

          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchInputRef}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 120)}
              placeholder="Search or type command..."
              className="h-9 w-full rounded-lg border border-input bg-muted/40 pr-14 pl-9 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
            />
            <kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>

            {searchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 z-20 mt-1.5 w-full overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lg">
                {searchResults.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => goToResult(item.href)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <item.icon className="size-4 text-muted-foreground" />
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

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
                    <DropdownMenuItem render={<Link href="/admin/moderation" />}>
                      {pendingCount} submission{pendingCount === 1 ? "" : "s"} awaiting moderation
                    </DropdownMenuItem>
                  )}
                  {unreadContactCount > 0 && (
                    <DropdownMenuItem render={<Link href="/admin/contact" />}>
                      {unreadContactCount} unread contact message{unreadContactCount === 1 ? "" : "s"}
                    </DropdownMenuItem>
                  )}
                  {pendingReportCount > 0 && (
                    <DropdownMenuItem render={<Link href="/admin/reports" />}>
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
                      (user.name?.[0]?.toUpperCase() ?? "A")
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
              <DropdownMenuItem render={<Link href="/admin/profile" />}>
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
