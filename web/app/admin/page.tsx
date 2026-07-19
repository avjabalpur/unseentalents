"use client";

import Link from "next/link";
import { CalendarRange, ShieldAlert, Tags } from "lucide-react";
import { useAdminEvents } from "@/lib/hooks/useAdmin";
import { usePendingSubmissions } from "@/lib/hooks/useAdmin";
import { useEventTypes } from "@/lib/hooks/useEventTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { data: events } = useAdminEvents();
  const { data: pending } = usePendingSubmissions();
  const { data: eventTypes } = useEventTypes();

  const stats = [
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
      <h1 className="mb-1 text-2xl font-semibold">Dashboard</h1>
      <p className="mb-6 text-sm text-muted-foreground">A quick look at what&apos;s happening across the platform.</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:ring-primary/30">
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
    </div>
  );
}
