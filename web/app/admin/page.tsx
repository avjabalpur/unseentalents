"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarRange, ShieldAlert, Tags } from "lucide-react";
import { useAdminEvents, useAdminStats } from "@/lib/hooks/useAdmin";
import { usePendingSubmissions } from "@/lib/hooks/useAdmin";
import { useEventTypes } from "@/lib/hooks/useEventTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/admin/Breadcrumb";
import { BarChartCard, ChartCardSkeleton, PieChartCard } from "@/components/admin/DashboardCharts";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { data: events, isLoading: eventsLoading } = useAdminEvents();
  const { data: pending, isLoading: pendingLoading } = usePendingSubmissions();
  const { data: eventTypes, isLoading: eventTypesLoading } = useEventTypes();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { data: stats, isLoading: statsLoading } = useAdminStats({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const statCardsLoading = eventsLoading || pendingLoading || eventTypesLoading;

  const statCards = [
    {
      label: "Event types",
      value: eventTypes?.length,
      icon: Tags,
      href: "/admin/event-types",
      accent: "bg-primary/15 text-primary",
    },
    {
      label: "Events",
      value: events?.length,
      icon: CalendarRange,
      href: "/admin/events",
      accent: "bg-primary/15 text-primary",
    },
    {
      label: "Pending moderation",
      value: pending?.length,
      icon: ShieldAlert,
      href: "/admin/moderation",
      accent:
        pending && pending.length > 0
          ? "bg-amber-500/15 text-amber-400"
          : "bg-primary/15 text-primary",
    },
  ];

  return (
    <div>
      <Breadcrumb items={[{ label: "Dashboard" }]} />
      <div className="grid gap-4 sm:grid-cols-3">
        {statCardsLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
          : statCards.map((stat) => (
              <Link key={stat.label} href={stat.href}>
                <Card className="h-full shadow-md shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30 hover:ring-primary/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm text-muted-foreground">{stat.label}</CardTitle>
                      <span className={cn("flex size-9 items-center justify-center rounded-full", stat.accent)}>
                        <stat.icon className="size-4.5" />
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="text-3xl font-bold">{stat.value ?? "–"}</CardContent>
                </Card>
              </Link>
            ))}
      </div>

      <div className="mt-10 mb-4 flex flex-wrap items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-wide uppercase">
          <span className="h-4 w-1 rounded-full bg-primary" />
          Platform activity
        </h2>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input type="date" className="h-8 w-36" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input type="date" className="h-8 w-36" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          {(dateFrom || dateTo) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {statsLoading ? (
          <>
            <ChartCardSkeleton title="Videos/entries by event" />
            <ChartCardSkeleton title="Votes by event" />
            <ChartCardSkeleton title="Entries by category" />
            <ChartCardSkeleton title="Entries by moderation status" />
            <ChartCardSkeleton title="Events by status" />
            <ChartCardSkeleton title="Users by role" />
          </>
        ) : (
          <>
            <BarChartCard title="Videos/entries by event" data={stats?.submissionsByEvent ?? []} />
            <BarChartCard title="Votes by event" data={stats?.votesByEvent ?? []} barColor="#3b82f6" />
            <PieChartCard title="Entries by category" data={stats?.submissionsByEventType ?? []} />
            <PieChartCard title="Entries by moderation status" data={stats?.submissionsByStatus ?? []} />
            <PieChartCard title="Events by status" data={stats?.eventsByStatus ?? []} />
            <PieChartCard title="Users by role" data={stats?.usersByRole ?? []} />
          </>
        )}
      </div>
    </div>
  );
}
