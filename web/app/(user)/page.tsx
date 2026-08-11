import Link from "next/link";
import { API_BASE_URL } from "@/lib/api-client";
import type { Event, PublicSummary, Slide } from "@/types/api";
import { EventsBrowser } from "@/components/user/EventsBrowser";
import { HeroSlider } from "@/components/user/HeroSlider";
import { RoundsSlider } from "@/components/user/RoundsSlider";
import { FeaturedTopicsSection } from "@/components/user/FeaturedTopicsSection";
import { OurStorySection } from "@/components/user/OurStorySection";
import { TopicExcerptSection } from "@/components/user/TopicExcerptSection";
import { StatsStrip } from "@/components/user/StatsStrip";
import { FadeIn } from "@/components/shared/FadeIn";
import { Button } from "@/components/ui/button";

async function getEvents(): Promise<Event[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/events`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as Event[];
  } catch {
    return [];
  }
}

async function getSlides(): Promise<Slide[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/slides`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as Slide[];
  } catch {
    return [];
  }
}

async function getSummary(): Promise<PublicSummary> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/stats/summary`, { cache: "no-store" });
    if (!res.ok) return { eventsCount: 0, categoriesCount: 0, submissionsCount: 0, prizesCount: 0 };
    return (await res.json()) as PublicSummary;
  } catch {
    return { eventsCount: 0, categoriesCount: 0, submissionsCount: 0, prizesCount: 0 };
  }
}

export default async function HomePage() {
  const [events, slides, summary] = await Promise.all([getEvents(), getSlides(), getSummary()]);

  return (
    <div>
      {slides.length > 0 ? (
        <HeroSlider slides={slides} />
      ) : (
        <section
          className="relative overflow-hidden border-b border-white/10 bg-black"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(var(--brand-rgb),0.35), transparent), radial-gradient(ellipse 60% 50% at 85% 15%, rgba(var(--brand-rgb),0.15), transparent)",
          }}
        >
          <div className="mx-auto max-w-[1600px] px-4 py-24 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              SecretWhiz
            </p>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-balance text-white sm:text-6xl">
              Show your talent. <span className="text-primary">Get discovered.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/70 text-balance">
              Join singing, dancing, acting, photography and painting competitions. Upload your
              entry, rally your friends, and vote your way to the top.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                className="animate-pulse-glow uppercase tracking-wide transition-transform duration-200 hover:scale-105"
                nativeButton={false}
                render={<Link href="/register">Register now</Link>}
              />
              <Button
                size="lg"
                variant="outline"
                className="uppercase tracking-wide border-white/30 text-white transition-transform duration-200 hover:scale-105 hover:bg-white/10 hover:text-white"
                nativeButton={false}
                render={<a href="#events">Browse events</a>}
              />
            </div>
          </div>
        </section>
      )}

      <StatsStrip summary={summary} />

      <OurStorySection />

      <RoundsSlider />

      <TopicExcerptSection topicKey="how-it-works" />

      <FeaturedTopicsSection />

      <section id="events" className="relative mx-auto max-w-[1600px] px-4 py-16">
        <FadeIn>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            Live right now
          </p>
          <h2 className="font-heading text-2xl font-semibold uppercase tracking-wide sm:text-3xl">
            SecretWhiz <span className="text-primary">competitions</span>
          </h2>
          <div className="mt-3 mb-8 h-[3px] w-16 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 animate-pulse bg-primary" />
          </div>
          <EventsBrowser events={events} />

          <div className="mt-10 flex justify-center">
            <Button
              variant="outline"
              size="lg"
              className="uppercase tracking-wide transition-transform duration-200 hover:scale-105 hover:border-primary"
              nativeButton={false}
              render={<Link href="/events">See every event &amp; competition</Link>}
            />
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
