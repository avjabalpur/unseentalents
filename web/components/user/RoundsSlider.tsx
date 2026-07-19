"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { FadeIn } from "@/components/shared/FadeIn";

const ROUNDS = [
  { image: "/rounds/round-1-backstage.jpg", title: "Backstage", subtitle: "Viewing Area" },
  { image: "/rounds/round-2-mainstage.jpg", title: "Mainstage", subtitle: "1st Voting Round" },
  { image: "/rounds/round-3-top60.jpg", title: "Top 60", subtitle: "2nd Voting Round" },
  { image: "/rounds/round-4-top50.jpg", title: "Top 50", subtitle: "3rd Voting Round" },
  { image: "/rounds/round-5-top40.jpg", title: "Top 40", subtitle: "4th Voting Round — All Events" },
  { image: "/rounds/round-6-top30.jpg", title: "Top 30", subtitle: "5th Voting Round — All Events" },
  { image: "/rounds/round-7-top15.jpg", title: "Top 15", subtitle: "6th Voting Round — All Events" },
  { image: "/rounds/round-8-top5.jpg", title: "Top 5", subtitle: "7th Voting Round — All Events" },
  { image: "/rounds/round-9-winner.jpg", title: "Top 1", subtitle: "The Winner — All Events" },
];

const AUTOPLAY_MS = 3200;

export function RoundsSlider() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    dragFree: false,
    slidesToScroll: 1,
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Autoplay — pauses on hover/focus so users can read the card they're on.
  useEffect(() => {
    if (!emblaApi || paused) return;
    const interval = setInterval(() => emblaApi.scrollNext(), AUTOPLAY_MS);
    return () => clearInterval(interval);
  }, [emblaApi, paused]);

  // Progress bar that fills up over each autoplay tick, matching the reel's own cadence.
  const [tick, setTick] = useState(0);
  const startRef = useRef(Date.now());
  useEffect(() => {
    if (paused) return;
    startRef.current = Date.now();
    const frame = { current: 0 };
    const raf = () => {
      const elapsed = Date.now() - startRef.current;
      setProgress(Math.min(100, (elapsed / AUTOPLAY_MS) * 100));
      frame.current = requestAnimationFrame(raf);
    };
    frame.current = requestAnimationFrame(raf);
    return () => cancelAnimationFrame(frame.current);
  }, [paused, tick]);
  useEffect(() => {
    setTick((t) => t + 1);
    setProgress(0);
  }, [selectedIndex]);

  const scrollTo = (i: number) => emblaApi?.scrollTo(i);

  return (
    <section
      className="relative overflow-hidden border-t border-white/10 bg-[#2F2F2F] py-16"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 50% 40% at 15% 0%, rgba(217,31,38,0.25), transparent), radial-gradient(ellipse 40% 30% at 100% 100%, rgba(217,31,38,0.15), transparent)",
        }}
      />
      <div className="relative mx-auto max-w-[1600px] px-4">
        <FadeIn>
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">The journey</p>
              <h2 className="mt-1 text-2xl font-semibold uppercase tracking-wide text-white sm:text-3xl">
                Talent rounds
              </h2>
              <div className="mt-3 h-[3px] w-24 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-primary transition-[width] duration-100 ease-linear"
                  style={{ width: `${((selectedIndex + progress / 100) / ROUNDS.length) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                aria-label="Previous round"
                onClick={() => emblaApi?.scrollPrev()}
                disabled={!canScrollPrev}
                className="flex size-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:scale-110 hover:border-primary hover:bg-primary/10 disabled:opacity-30 disabled:hover:scale-100"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                aria-label="Next round"
                onClick={() => emblaApi?.scrollNext()}
                disabled={!canScrollNext}
                className="flex size-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:scale-110 hover:border-primary hover:bg-primary/10 disabled:opacity-30 disabled:hover:scale-100"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        </FadeIn>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {ROUNDS.map((round, i) => {
              const isActive = i === selectedIndex;
              return (
                <div
                  key={round.title}
                  className="animate-slide-up min-w-0 flex-[0_0_78%] opacity-0 sm:flex-[0_0_42%] lg:flex-[0_0_23%]"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <div
                    className={cn(
                      "group relative overflow-hidden rounded-lg border bg-black transition-all duration-500",
                      isActive
                        ? "border-primary shadow-[0_0_30px_-5px_rgba(217,31,38,0.6)]"
                        : "border-white/10 hover:border-white/30",
                    )}
                  >
                    <div className="relative aspect-[4/5] w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={round.image}
                        alt={`${round.title} — ${round.subtitle}`}
                        className={cn(
                          "h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110",
                          isActive && "scale-105",
                        )}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      <div
                        className={cn(
                          "absolute left-0 top-0 flex size-10 items-center justify-center text-sm font-bold text-white transition-colors duration-300",
                          isActive ? "bg-primary" : "bg-black/60 backdrop-blur",
                        )}
                      >
                        {i + 1}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 transition-transform duration-500 group-hover:-translate-y-1">
                        <h3 className="text-lg font-bold uppercase tracking-wide text-white drop-shadow">
                          {round.title}
                        </h3>
                        <p className="mt-0.5 text-sm text-white/70 drop-shadow">{round.subtitle}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-1.5">
          {ROUNDS.map((round, i) => (
            <button
              key={round.title}
              aria-label={`Go to ${round.title}`}
              onClick={() => scrollTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === selectedIndex ? "w-6 bg-primary" : "w-1.5 bg-white/25 hover:bg-white/50",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
