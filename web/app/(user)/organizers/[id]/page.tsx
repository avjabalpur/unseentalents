"use client";

import { use } from "react";
import { AtSign, CalendarRange, Camera, ThumbsUp } from "lucide-react";
import { useOrganizerProfile } from "@/lib/hooks/useOrganizerDirectory";
import { mediaUrl } from "@/lib/api-client";
import { EventsBrowser } from "@/components/user/EventsBrowser";
import { FadeIn } from "@/components/shared/FadeIn";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrganizerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: organizer, isLoading } = useOrganizerProfile(id);

  if (isLoading || !organizer) {
    return (
      <div className="mx-auto max-w-[1600px] px-4 py-16">
        <Skeleton className="mb-6 size-24 rounded-full" />
        <Skeleton className="h-8 w-64" />
      </div>
    );
  }

  const avatarUrl = mediaUrl(organizer.avatarKey);

  return (
    <div>
      <section
        className="relative overflow-hidden border-b border-white/10 bg-black py-16"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(var(--brand-rgb),0.3), transparent)",
        }}
      >
        <div className="mx-auto max-w-[1600px] px-4">
          <FadeIn>
            <div className="flex flex-wrap items-center gap-5">
              <span className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-3xl font-bold text-primary">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={organizer.name} className="size-full object-cover" />
                ) : (
                  organizer.name[0]?.toUpperCase()
                )}
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Organizer</p>
                <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl">{organizer.name}</h1>
                <p className="text-white/60">@{organizer.username}</p>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1.5 text-sm text-white/70">
                    <CalendarRange className="size-4 text-primary" />
                    {organizer.publishedEventCount} event{organizer.publishedEventCount === 1 ? "" : "s"}
                  </span>
                  {organizer.facebookUrl && (
                    <a href={organizer.facebookUrl} target="_blank" rel="noreferrer" className="text-white/60 hover:text-primary">
                      <ThumbsUp className="size-4" />
                    </a>
                  )}
                  {organizer.instagramUrl && (
                    <a href={organizer.instagramUrl} target="_blank" rel="noreferrer" className="text-white/60 hover:text-primary">
                      <Camera className="size-4" />
                    </a>
                  )}
                  {organizer.twitterUrl && (
                    <a href={organizer.twitterUrl} target="_blank" rel="noreferrer" className="text-white/60 hover:text-primary">
                      <AtSign className="size-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] px-4 py-12">
        <h2 className="font-heading mb-6 text-xl font-semibold uppercase tracking-wide">
          Events by <span className="text-primary">{organizer.name}</span>
        </h2>
        <EventsBrowser events={organizer.events} />
      </div>
    </div>
  );
}
