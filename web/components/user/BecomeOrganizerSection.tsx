"use client";

import Link from "next/link";
import { CalendarRange } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { FadeIn } from "@/components/shared/FadeIn";
import { Button } from "@/components/ui/button";

export function BecomeOrganizerSection() {
  const { user, isLoading } = useAuth();

  if (!isLoading && (user?.role === "ADMIN" || user?.role === "MODERATOR")) return null;

  const cta =
    !user
      ? { href: "/register/organizer", label: "Become an organizer" }
      : user.role === "ORGANIZER"
        ? { href: "/organizer", label: "Go to your dashboard" }
        : { href: "/account/organizer", label: "Apply now" };

  return (
    <section
      className="relative overflow-hidden border-y border-white/10 bg-black py-20"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 60% 60% at 50% 100%, rgba(var(--brand-rgb),0.18), transparent)",
      }}
    >
      <div className="relative mx-auto max-w-3xl px-4 text-center">
        <FadeIn>
          <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <CalendarRange className="size-7" />
          </span>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">For organizers</p>
          <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
            Got a competition of your own? <span className="text-primary">Run it here.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/70 text-balance">
            Become an organizer to create and manage your own events, stages, and prizes on SecretWhiz. Every
            application is reviewed by an admin to keep the stage trustworthy.
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              className="animate-pulse-glow uppercase tracking-wide transition-transform duration-200 hover:scale-105"
              nativeButton={false}
              render={<Link href={cta.href}>{cta.label}</Link>}
            />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
