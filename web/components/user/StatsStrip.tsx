"use client";

import { useEffect, useRef, useState } from "react";
import { Layers, Tags, Trophy, Video } from "lucide-react";
import type { PublicSummary } from "@/types/api";

const DURATION_MS = 1200;

function useCountUp(target: number, start: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;
    const startTime = Date.now();
    let frame = 0;
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / DURATION_MS);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, target]);

  return value;
}

function StatItem({ icon: Icon, label, value, start }: { icon: typeof Video; label: string; value: number; start: boolean }) {
  const count = useCountUp(value, start);
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Icon className="size-6" />
      </span>
      <span className="text-3xl font-bold text-white sm:text-4xl">{count}+</span>
      <span className="text-sm uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}

export function StatsStrip({ summary }: { summary: PublicSummary }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative overflow-hidden border-y border-white/10 bg-black py-12">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 55% 70% at 10% 50%, rgba(var(--brand-rgb),0.14), transparent), radial-gradient(ellipse 55% 70% at 90% 50%, rgba(var(--brand-rgb),0.1), transparent)",
        }}
      />
      <div className="relative mx-auto grid max-w-[1600px] grid-cols-2 gap-8 px-4 sm:grid-cols-4">
        <StatItem icon={Tags} label="Categories" value={summary.categoriesCount} start={visible} />
        <StatItem icon={Layers} label="Live Competitions" value={summary.eventsCount} start={visible} />
        <StatItem icon={Video} label="Entries Submitted" value={summary.submissionsCount} start={visible} />
        <StatItem icon={Trophy} label="Prizes Up For Grabs" value={summary.prizesCount} start={visible} />
      </div>
    </section>
  );
}
