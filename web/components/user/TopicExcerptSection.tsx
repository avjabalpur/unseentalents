"use client";

import Link from "next/link";
import { useTopic } from "@/lib/hooks/useTopics";
import { FadeIn } from "@/components/shared/FadeIn";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const EXCERPT_MAX_CHARS = 260;

function stripHtmlAndTruncate(html: string, maxChars: number = EXCERPT_MAX_CHARS): string {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars).trimEnd()}…`;
}

/** Reusable "excerpt + See more" preview for any CMS Topic — used on the home
 * page so full topic content lives at /pages/[key], not duplicated inline. */
export function TopicExcerptSection({ topicKey }: { topicKey: string }) {
  const { data: topic, isLoading } = useTopic(topicKey);

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-full max-w-2xl" />
          <Skeleton className="h-4 w-3/4 max-w-xl" />
          <Skeleton className="mt-3 h-9 w-32 rounded-lg" />
        </div>
      </section>
    );
  }

  if (!topic) return null;

  const excerpt = stripHtmlAndTruncate(topic.htmlContent);

  return (
    <section className="relative overflow-hidden py-16 text-center">
      <div
        className="animate-drift pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 50% 60% at 50% 100%, rgba(var(--brand-rgb),0.1), transparent)",
        }}
      />
      <div className="relative mx-auto max-w-5xl px-4">
        <FadeIn>
          {topic.subtitle && (
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              {topic.subtitle}
            </p>
          )}
          <h2 className="font-heading text-3xl font-bold text-white">{topic.title}</h2>
          <p className="mx-auto mt-4 max-w-3xl text-white/70">{excerpt}</p>
          <div className="mt-6">
            <Button
              variant="outline"
              className="uppercase tracking-wide transition-transform duration-200 hover:scale-105 hover:border-primary"
              nativeButton={false}
              render={<Link href={`/pages/${topic.key}`}>See more</Link>}
            />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
