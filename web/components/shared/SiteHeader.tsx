"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, KeyRound, ShieldCheck, ThumbsUp, User as UserIcon, Video, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/shared/Brand";
import { CreditBalanceBadge } from "@/components/shared/CreditBalanceBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { EventsNavDropdown } from "@/components/shared/EventsNavDropdown";
import { MobileNav } from "@/components/shared/MobileNav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinkBaseClass = "rounded-full px-3 py-2 text-sm font-medium uppercase tracking-wide transition-colors";
const navLinkInactiveClass = "text-white/80 hover:bg-white/5 hover:text-primary";
const navLinkActiveClass = "bg-primary/15 text-white";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function SiteHeader() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [condensed, setCondensed] = useState(false);

  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkClass = (href: string) => {
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return cn(navLinkBaseClass, active ? navLinkActiveClass : navLinkInactiveClass);
  };

  return (
    <div className="sticky top-0 z-40 flex justify-center px-3 pt-3 sm:px-4 sm:pt-4">
      <header
        className={cn(
          "flex w-full items-center justify-between gap-4 rounded-full border border-white/10 bg-black/70 backdrop-blur-md transition-all duration-300 supports-[backdrop-filter]:bg-black/60",
          condensed
            ? "max-w-4xl border-primary/30 bg-black/85 px-2.5 py-1.5 shadow-lg shadow-black/40"
            : "max-w-7xl px-3 py-2.5 sm:px-4",
        )}
      >
        <Link href="/" className="flex shrink-0 items-center pl-2">
          <Brand className={cn("transition-all", condensed && "text-lg")} />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/" className={linkClass("/")}>
            Home
          </Link>
          <EventsNavDropdown active={pathname.startsWith("/events")} />
          <Link href="/gallery" className={linkClass("/gallery")}>
            Gallery
          </Link>
          <Link href="/pages/whats-new" className={linkClass("/pages/whats-new")}>
            What&apos;s New
          </Link>
          <Link href="/pages/about-us" className={linkClass("/pages/about-us")}>
            About Us
          </Link>
          <Link href="/upload" className={linkClass("/upload")}>
            Upload
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {!isLoading && user && <CreditBalanceBadge />}
          {isLoading ? (
            <Skeleton className="size-9 rounded-full" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    aria-label="Account menu"
                    className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 py-0.5 pr-1.5 pl-0.5 transition-colors hover:border-primary/40 hover:bg-white/10"
                  >
                    <span
                      className={cn(
                        "flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#5a00cc] font-heading text-xs font-bold text-white transition-all",
                        condensed ? "size-7" : "size-8",
                      )}
                    >
                      {initials(user.name)}
                    </span>
                    <ChevronDown className="size-3.5 text-white/50" />
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="truncate text-sm font-semibold">{user.name}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/account" />}>
                  <UserIcon className="size-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/account/password" />}>
                  <KeyRound className="size-4" />
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/account/uploads" />}>
                  <Video className="size-4" />
                  My Uploads
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/account/votes" />}>
                  <ThumbsUp className="size-4" />
                  My Votes
                </DropdownMenuItem>
                {user.role === "ADMIN" && (
                  <DropdownMenuItem render={<Link href="/admin" />}>
                    <ShieldCheck className="size-4" />
                    Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={async () => {
                    await logout();
                    router.push("/");
                  }}
                >
                  <LogOut className="size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:gap-3 md:flex">
              <Button
                variant="ghost"
                size="sm"
                className="uppercase tracking-wide"
                nativeButton={false}
                render={<Link href="/login">Sign in</Link>}
              />
              <Button
                size="sm"
                className="animate-pulse-glow uppercase tracking-wide"
                nativeButton={false}
                render={<Link href="/register">Register now</Link>}
              />
            </div>
          )}
          <MobileNav />
        </div>
      </header>
    </div>
  );
}
