"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, KeyRound, ShieldCheck, ThumbsUp, User as UserIcon, Video, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/shared/Brand";
import { CreditBalanceBadge } from "@/components/shared/CreditBalanceBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { EventsNavDropdown } from "@/components/shared/EventsNavDropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinkClass =
  "px-3 py-2 text-sm font-medium uppercase tracking-wide text-white/90 hover:text-primary";

export function SiteHeader() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur supports-[backdrop-filter]:bg-black/60">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <Brand />
        </Link>

        <nav className="hidden items-center md:flex">
          <Link href="/" className={navLinkClass}>
            Home
          </Link>
          <EventsNavDropdown />
          <Link href="/pages/whats-new" className={navLinkClass}>
            What&apos;s New
          </Link>
          <Link href="/pages/about-us" className={navLinkClass}>
            About Us
          </Link>
          <Link href="/upload" className={navLinkClass}>
            Upload
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {!isLoading && user && <CreditBalanceBadge />}
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="sm" className="gap-1.5 uppercase tracking-wide">
                    <span className="max-w-28 truncate">{user.name}</span>
                    <ChevronDown className="size-3.5" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-56">
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
            <>
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
            </>
          )}
        </div>
      </div>
    </header>
  );
}
