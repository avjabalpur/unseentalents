"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { CreditBalanceBadge } from "@/components/shared/CreditBalanceBadge";
import { EventsNavDropdown } from "@/components/shared/EventsNavDropdown";

const navLinkClass =
  "px-3 py-2 text-sm font-medium uppercase tracking-wide text-white/90 hover:text-primary";

export function SiteHeader() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur supports-[backdrop-filter]:bg-black/60">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/unseentalents-logo.jpg"
            alt="Unseen Talents"
            width={150}
            height={50}
            priority
            className="h-10 w-auto"
          />
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
          {isLoading ? null : user ? (
            <>
              {user.role === "ADMIN" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="uppercase tracking-wide"
                  nativeButton={false}
                  render={<Link href="/admin">Admin</Link>}
                />
              )}
              <Button
                size="sm"
                className="uppercase tracking-wide"
                onClick={async () => {
                  await logout();
                  router.push("/");
                }}
              >
                Log out
              </Button>
            </>
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
