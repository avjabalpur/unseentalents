"use client";

import Link from "next/link";
import { useTopics } from "@/lib/hooks/useTopics";
import { FadeIn } from "@/components/shared/FadeIn";
import { Button } from "@/components/ui/button";

export function FeaturedTopicsSection() {
  const { data: topics } = useTopics(true);

  if (!topics || topics.length === 0) return null;

  const shown = topics.slice(0, 3);
  const cols = shown.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";

  return (
    <section className="border-y border-white/10 bg-black">
      <div className={`mx-auto grid max-w-[1600px] gap-px bg-white/10 ${cols}`}>
        {shown.map((topic, i) => (
          <FadeIn key={topic.id} delay={i * 150} className="bg-black">
            <div className="group relative flex h-full flex-col items-center justify-center overflow-hidden p-10 text-center transition-colors hover:bg-white/[0.04]">
              <div className="pointer-events-none absolute inset-0 origin-bottom scale-y-0 bg-gradient-to-t from-primary/15 to-transparent transition-transform duration-500 ease-out group-hover:scale-y-100" />
              <h3 className="relative text-2xl font-bold uppercase tracking-wide text-white transition-transform duration-300 group-hover:-translate-y-0.5">
                {topic.title}
              </h3>
              {topic.subtitle && (
                <p className="relative mt-1 text-sm uppercase tracking-widest text-primary">{topic.subtitle}</p>
              )}
              <div className="relative mt-6">
                <Button
                  className="uppercase tracking-wide transition-transform duration-200 group-hover:scale-105"
                  nativeButton={false}
                  render={<Link href={`/pages/${topic.key}`}>See more</Link>}
                />
              </div>
              <div className="pointer-events-none absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 bg-primary transition-all duration-500 group-hover:w-2/3" />
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
