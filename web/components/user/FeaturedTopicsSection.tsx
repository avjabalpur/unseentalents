"use client";

import Link from "next/link";
import { useTopics } from "@/lib/hooks/useTopics";
import { FadeIn } from "@/components/shared/FadeIn";
import { Button } from "@/components/ui/button";

const FALLBACK_IMAGES: Record<string, string> = {
  performers: "/rounds/round-2-mainstage.jpg",
  "talent-lovers": "/rounds/round-8-top5.jpg",
  "upcoming-events": "/rounds/round-5-top40.jpg",
};
const IMAGE_POOL = Object.values(FALLBACK_IMAGES);

export function FeaturedTopicsSection() {
  const { data: topics } = useTopics(true);

  if (!topics || topics.length === 0) return null;

  const shown = topics.slice(0, 3);
  const cols = shown.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";

  return (
    <section className="relative overflow-hidden bg-black py-16">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 60% at 50% 100%, rgba(var(--brand-rgb),0.14), transparent)",
        }}
      />
      <div className="relative mx-auto max-w-[1600px] px-4">
        <FadeIn>
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            Get involved
          </p>
          <h2 className="font-heading mb-10 text-center text-2xl font-semibold uppercase tracking-wide sm:text-3xl">
            Wherever you fit <span className="text-primary">in the story</span>
          </h2>
        </FadeIn>
        <div className={`grid gap-5 ${cols}`}>
          {shown.map((topic, i) => {
            const image = FALLBACK_IMAGES[topic.key] ?? IMAGE_POOL[i % IMAGE_POOL.length];
            return (
              <FadeIn key={topic.id} delay={i * 150}>
                <Link
                  href={`/pages/${topic.key}`}
                  className="group relative flex h-[420px] flex-col justify-end overflow-hidden rounded-2xl border border-white/10"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10 transition-colors duration-300 group-hover:from-black/95" />
                  <div className="relative p-7">
                    {topic.subtitle && (
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                        {topic.subtitle}
                      </p>
                    )}
                    <h3 className="text-2xl font-bold uppercase tracking-wide text-white">{topic.title}</h3>
                    <div className="mt-4 flex items-center gap-2 opacity-0 transition-all duration-300 group-hover:opacity-100">
                      <Button
                        size="sm"
                        className="pointer-events-none uppercase tracking-wide"
                        nativeButton={false}
                        render={<span>See more</span>}
                      />
                    </div>
                  </div>
                </Link>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
