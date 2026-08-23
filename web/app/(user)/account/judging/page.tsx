"use client";

import Link from "next/link";
import { Gavel } from "lucide-react";
import { useEventsIJudge } from "@/lib/hooks/useJudgeScores";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";

export default function AccountJudgingPage() {
  const { data: events, isLoading } = useEventsIJudge();

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Judging</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-32 w-full rounded-lg" />
        ) : !events || events.length === 0 ? (
          <EmptyState icon={Gavel} title="Not judging anything yet" description="Events you're assigned to judge will show up here." />
        ) : (
          events.map((event) => (
            <Link
              key={event.id}
              href={`/account/judging/${event.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              <div>
                <p className="font-medium">{event.name}</p>
                <p className="text-xs text-muted-foreground">
                  {event.currentStageName ? event.currentStageName.replace("_", " ") : "No active stage"}
                </p>
              </div>
              <Badge variant={event.status === "PUBLISHED" ? "default" : "secondary"}>{event.status}</Badge>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
