"use client";

import Link from "next/link";
import { CalendarRange, Users } from "lucide-react";
import { useOrganizers } from "@/lib/hooks/useOrganizerDirectory";
import { mediaUrl } from "@/lib/api-client";
import { EmptyState } from "@/components/shared/EmptyState";
import { FadeIn } from "@/components/shared/FadeIn";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrganizersPage() {
  const { data: organizers, isLoading } = useOrganizers();

  return (
    <div>
      <section
        className="relative overflow-hidden border-b border-white/10 bg-black py-20"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(var(--brand-rgb),0.3), transparent)",
        }}
      >
        <div className="mx-auto max-w-[1600px] px-4 text-center">
          <FadeIn>
            <p className="mb-3 flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              <Users className="size-4" />
              The people behind the stage
            </p>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Our <span className="text-primary">organizers</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
              Meet the organizers running competitions on SecretWhiz.
            </p>
          </FadeIn>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] px-4 py-12">
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : !organizers || organizers.length === 0 ? (
          <EmptyState icon={Users} title="No organizers yet" description="Approved organizers will show up here." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {organizers.map((organizer) => {
              const avatarUrl = mediaUrl(organizer.avatarKey);
              return (
                <FadeIn key={organizer.id}>
                  <Link href={`/organizers/${organizer.id}`}>
                    <Card className="h-full border-white/10 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
                      <CardContent className="flex flex-col items-center gap-3 py-8">
                        <span className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-xl font-bold text-primary">
                          {avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatarUrl} alt={organizer.name} className="size-full object-cover" />
                          ) : (
                            organizer.name[0]?.toUpperCase()
                          )}
                        </span>
                        <div>
                          <p className="font-semibold text-white">{organizer.name}</p>
                          <p className="text-xs text-muted-foreground">@{organizer.username}</p>
                        </div>
                        <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-primary">
                          <CalendarRange className="size-3.5" />
                          {organizer.publishedEventCount} event{organizer.publishedEventCount === 1 ? "" : "s"}
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                </FadeIn>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
