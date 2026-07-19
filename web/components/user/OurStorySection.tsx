"use client";

import DOMPurify from "isomorphic-dompurify";
import { useTopic } from "@/lib/hooks/useTopics";
import { FadeIn } from "@/components/shared/FadeIn";

export function OurStorySection() {
  const { data: topic } = useTopic("about-us");

  if (!topic) return null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-black to-background py-20">
      <div
        className="animate-drift pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(217,31,38,0.16), transparent)",
        }}
      />
      <div className="relative mx-auto max-w-4xl px-4 text-center">
        <FadeIn>
          {topic.subtitle && (
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              {topic.subtitle}
            </p>
          )}
          <h2 className="text-3xl font-bold text-white sm:text-4xl">{topic.title}</h2>
          <div className="mx-auto mt-4 h-[3px] w-16 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 animate-pulse bg-primary" />
          </div>
          <div
            className="mt-6 text-lg leading-relaxed text-white/80 [&_p]:mb-4"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(topic.htmlContent) }}
          />
        </FadeIn>
      </div>
    </section>
  );
}
