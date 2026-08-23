"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import { useWinners } from "@/lib/hooks/useWinners";
import { mediaUrl } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { MediaPlayer } from "@/components/shared/MediaPlayer";
import { EmptyState } from "@/components/shared/EmptyState";
import { SubmissionGridSkeleton } from "@/components/shared/SubmissionCardSkeleton";
import { FadeIn } from "@/components/shared/FadeIn";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function WinnersPage() {
  const { data: winners, isLoading } = useWinners();

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
              <Trophy className="size-4" />
              Hall of fame
            </p>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Meet our <span className="text-primary">winners</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
              Every crowned act, across every SecretWhiz competition.
            </p>
          </FadeIn>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] px-4 py-12">
        {isLoading ? (
          <SubmissionGridSkeleton />
        ) : !winners || winners.length === 0 ? (
          <EmptyState icon={Trophy} title="No winners yet" description="Crowned acts will show up here." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {winners.map((winner) => {
              const submission = winner.submission;
              const posterUrl = submission ? mediaUrl(submission.thumbnailKey) : null;
              const videoUrl = submission?.mediaType === "VIDEO" ? mediaUrl(submission.storageKey) : null;
              const imageUrl = submission?.mediaType === "IMAGE" ? mediaUrl(submission.storageKey) : null;

              return (
                <FadeIn key={winner.participationId}>
                  <Card className="gap-0 overflow-hidden border-[#e8c34a]/40 py-0 shadow-[0_0_24px_-8px_rgba(232,195,74,0.35)]">
                    <div className="relative aspect-video bg-black">
                      <span className="absolute left-2 top-2 z-20 inline-flex items-center gap-1 rounded-full bg-[#e8c34a] px-2 py-0.5 text-xs font-bold text-black">
                        <Trophy className="size-3" /> Winner
                      </span>
                      {submission ? (
                        <MediaPlayer
                          mediaType={submission.mediaType}
                          videoUrl={videoUrl}
                          imageUrl={imageUrl}
                          posterUrl={posterUrl}
                          alt={submission.title ?? "Winning entry"}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                          No entry on file
                        </div>
                      )}
                    </div>
                    <CardContent className="space-y-2 pt-4 pb-5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-white">{winner.userName}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(winner.wonAt)}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Link href={`/events/${winner.eventId}`}>
                          <Badge variant="secondary">{winner.eventName}</Badge>
                        </Link>
                        <Badge variant="outline">{winner.eventTypeName}</Badge>
                      </div>
                      {submission?.title && (
                        <p className="text-sm text-muted-foreground">&ldquo;{submission.title}&rdquo;</p>
                      )}
                    </CardContent>
                  </Card>
                </FadeIn>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
