"use client";

import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Gavel, Trophy } from "lucide-react";
import type { Event, Prize, Stage } from "@/types/api";
import { useAuth } from "@/lib/auth-context";
import { useMyParticipation, useParticipate } from "@/lib/hooks/useEvents";
import { useStageLeaderboard } from "@/lib/hooks/useSubmissions";
import { useEventTypes } from "@/lib/hooks/useEventTypes";
import { ApiError, mediaUrl } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EventStatusBadge } from "@/components/shared/EventStatusBadge";
import { SubmissionCard } from "@/components/shared/SubmissionCard";
import { SubmissionGridSkeleton } from "@/components/shared/SubmissionCardSkeleton";
import { SubmissionUploadForm } from "@/components/user/SubmissionUploadForm";
import { VoteButton } from "@/components/user/VoteButton";
import { FadeIn } from "@/components/shared/FadeIn";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function findActiveStage(stages: Stage[]): Stage | null {
  const now = new Date();
  return stages.find((s) => new Date(s.startAt) <= now && now <= new Date(s.endAt)) ?? null;
}

const RANK_STYLES: Record<number, string> = {
  1: "border-[#e8c34a]/50 shadow-[0_0_24px_-8px_rgba(232,195,74,0.5)]",
  2: "border-[#c7c7c7]/40 shadow-[0_0_24px_-8px_rgba(199,199,199,0.35)]",
  3: "border-[#cd7f32]/40 shadow-[0_0_24px_-8px_rgba(205,127,50,0.35)]",
};

const RANK_ICON_STYLES: Record<number, string> = {
  1: "bg-[#e8c34a] text-black",
  2: "bg-[#c7c7c7] text-black",
  3: "bg-[#cd7f32] text-black",
};

function PrizesSection({ prizes }: { prizes: Prize[] }) {
  if (prizes.length === 0) return null;
  const sorted = [...prizes].sort((a, b) => a.rank - b.rank);

  return (
    <FadeIn className="mb-10">
      <h2 className="font-heading mb-4 flex items-center gap-2 text-xl font-semibold uppercase tracking-wide">
        <Trophy className="size-5 text-primary" />
        Prizes <span className="text-primary">up for grabs</span>
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((prize) => (
          <div
            key={prize.id}
            className={cn(
              "rounded-lg border border-white/10 bg-card p-5 transition-transform duration-300 hover:-translate-y-1",
              RANK_STYLES[prize.rank],
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary",
                  RANK_ICON_STYLES[prize.rank],
                )}
              >
                #{prize.rank}
              </span>
              <div>
                <p className="font-semibold text-white">{prize.title}</p>
                <p className="text-sm text-white/70">{prize.reward}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </FadeIn>
  );
}

export function EventDetailClient({ event, stages, prizes }: { event: Event; stages: Stage[]; prizes: Prize[] }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const activeStage = findActiveStage(stages);
  const orderedStages = [...stages].sort((a, b) => a.orderIndex - b.orderIndex);

  const { data: eventTypes } = useEventTypes();
  const eventType = eventTypes?.find((et) => et.id === event.eventTypeId);
  const bannerUrl = mediaUrl(eventType?.imageKey);

  const { data: participation } = useMyParticipation(event.id, !!user);
  const participate = useParticipate(event.id);

  const { data: leaderboard, isLoading: leaderboardLoading } = useStageLeaderboard(activeStage?.id);

  const isEligibleToUpload =
    !!activeStage && !!participation && participation.currentStageId === activeStage.id;

  const handleJoin = () => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    participate.mutate(undefined, {
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't join this event."),
    });
  };

  return (
    <div>
      <section
        className="relative overflow-hidden border-b border-white/10 bg-black"
        style={
          bannerUrl
            ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : {
                backgroundImage:
                  "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(var(--brand-rgb),0.3), transparent)",
              }
        }
      >
        <div className="bg-black/70 backdrop-blur-[1px]">
          <div className="mx-auto max-w-[1600px] px-4 py-16">
            <FadeIn>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <EventStatusBadge status={event.computedStatus ?? "UPCOMING"} />
                    {eventType && (
                      <span className="text-sm uppercase tracking-widest text-primary">{eventType.name}</span>
                    )}
                  </div>
                  <h1 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">{event.name}</h1>
                  <p className="mt-2 max-w-3xl text-white/70">{event.description}</p>
                  {event.winningMode === "JUDGE_SCORE" && event.judges.length > 0 && (
                    <p className="mt-3 flex items-center gap-1.5 text-sm text-white/70">
                      <Gavel className="size-4 text-primary" />
                      Judged by {event.judges.map((j) => j.judgeName).filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
                {!participation && (
                  <Button
                    className="uppercase tracking-wide transition-transform duration-200 hover:scale-105"
                    onClick={handleJoin}
                    disabled={participate.isPending}
                  >
                    {participate.isPending ? "Joining…" : "Enter this competition"}
                  </Button>
                )}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] px-4 py-10">
        <PrizesSection prizes={prizes} />

        {orderedStages.length > 0 && (
          <FadeIn>
            <div className="mb-10 flex flex-wrap items-center gap-2">
              {orderedStages.map((stage, i) => (
                <div key={stage.id} className="flex items-center gap-2">
                  <div
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      activeStage?.id === stage.id
                        ? "border-primary bg-primary/10 font-medium text-primary"
                        : "border-white/10 text-muted-foreground"
                    }`}
                  >
                    {stage.name.replace("_", " ")}
                    <span className="ml-1.5 text-xs opacity-70">
                      {formatDate(stage.startAt)} – {formatDate(stage.endAt)}
                    </span>
                  </div>
                  {i < orderedStages.length - 1 && (
                    <ArrowRight className="size-3.5 shrink-0 text-white/20" />
                  )}
                </div>
              ))}
            </div>
          </FadeIn>
        )}

        {isEligibleToUpload && activeStage && eventType && (
          <FadeIn className="mb-10">
            <SubmissionUploadForm stageId={activeStage.id} mediaType={eventType.submissionMediaType} />
          </FadeIn>
        )}

        <FadeIn>
          <h2 className="font-heading mb-4 text-xl font-semibold uppercase tracking-wide">
            {activeStage ? (
              <>
                {activeStage.name.replace("_", " ")} <span className="text-primary">entries</span>
              </>
            ) : (
              "No active stage right now"
            )}
          </h2>

          {activeStage ? (
            leaderboardLoading ? (
              <SubmissionGridSkeleton />
            ) : leaderboard && leaderboard.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {leaderboard.map((submission, index) => (
                  <SubmissionCard
                    key={submission.id}
                    submission={submission}
                    rank={index + 1}
                    winningMode={event.winningMode}
                    action={
                      event.winningMode === "AUDIENCE_VOTE" ? (
                        <VoteButton stageId={activeStage.id} submissionId={submission.id} />
                      ) : undefined
                    }
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No approved entries yet — be the first!
                </CardContent>
              </Card>
            )
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Check back when the next stage opens.
              </CardContent>
            </Card>
          )}
        </FadeIn>
      </div>
    </div>
  );
}
