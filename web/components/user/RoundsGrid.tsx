import { cn } from "@/lib/utils";
import { FadeIn } from "@/components/shared/FadeIn";

const ROUNDS = [
  {
    image: "/rounds/round-1-backstage.jpg",
    title: "Backstage",
    subtitle: "Viewing area",
    span: "md:col-span-2 md:row-span-2",
    glow: 0.12,
  },
  {
    image: "/rounds/round-2-mainstage.jpg",
    title: "Mainstage",
    subtitle: "1st voting round",
    span: "md:col-span-2 md:row-span-2",
    glow: 0.18,
  },
  {
    image: "/rounds/round-3-top60.jpg",
    title: "Top 60",
    subtitle: "2nd voting round",
    span: "md:col-span-2 md:row-span-2",
    glow: 0.24,
  },
  {
    image: "/rounds/round-4-top50.jpg",
    title: "Top 50",
    subtitle: "3rd round",
    span: "md:col-span-1 md:row-span-1",
    glow: 0.28,
  },
  {
    image: "/rounds/round-5-top40.jpg",
    title: "Top 40",
    subtitle: "4th round",
    span: "md:col-span-1 md:row-span-1",
    glow: 0.32,
  },
  {
    image: "/rounds/round-6-top30.jpg",
    title: "Top 30",
    subtitle: "5th round",
    span: "md:col-span-1 md:row-span-1",
    glow: 0.36,
  },
  {
    image: "/rounds/round-7-top15.jpg",
    title: "Top 15",
    subtitle: "6th round",
    span: "md:col-span-1 md:row-span-1",
    glow: 0.4,
  },
  {
    image: "/rounds/round-8-top5.jpg",
    title: "Top 5",
    subtitle: "7th round · all events",
    span: "col-span-2 md:col-span-2 md:row-span-1",
    glow: 0.46,
  },
  {
    image: "/rounds/round-9-winner.jpg",
    title: "The Winner",
    subtitle: "Crowned across all events",
    span: "col-span-2 md:col-span-6 md:row-span-2",
    glow: 0.6,
    final: true,
  },
];

export function RoundsGrid() {
  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-black py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 50% 40% at 15% 0%, rgba(var(--brand-rgb),0.25), transparent), radial-gradient(ellipse 40% 30% at 100% 100%, rgba(var(--brand-rgb),0.15), transparent)",
        }}
      />
      <div className="relative mx-auto max-w-[1600px] px-4">
        <FadeIn>
          <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">The journey</p>
              <h2 className="font-heading mt-1 text-2xl font-semibold uppercase tracking-wide text-white sm:text-3xl">
                Talent rounds
              </h2>
            </div>
            <p className="max-w-xs text-sm text-white/50 sm:text-right">
              The field narrows every round — tile size tracks how many acts are left standing.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-6 md:auto-rows-[150px]">
          {ROUNDS.map((round, i) => (
            <div
              key={round.title}
              className={cn(
                "animate-slide-up group relative aspect-[4/5] overflow-hidden rounded-lg border opacity-0 transition-colors duration-300 md:aspect-auto",
                round.span,
                round.final ? "border-primary/50" : "border-white/10 hover:border-white/30",
              )}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={round.image}
                alt={`${round.title} — ${round.subtitle}`}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage: `radial-gradient(ellipse 70% 60% at 50% 0%, rgba(var(--brand-rgb),${round.glow}), transparent 70%)`,
                }}
              />
              <div
                className={cn(
                  "absolute left-0 top-0 flex h-7 min-w-7 items-center justify-center px-2 text-xs font-bold text-white",
                  round.final ? "bg-primary" : "bg-black/60 backdrop-blur",
                )}
              >
                {round.final ? "Final" : `0${i + 1}`}
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 transition-transform duration-500 group-hover:-translate-y-1">
                <h3
                  className={cn(
                    "font-heading uppercase tracking-wide text-white drop-shadow",
                    round.final ? "text-2xl" : "text-base",
                  )}
                >
                  {round.title}
                </h3>
                <p className="mt-0.5 text-sm text-white/70 drop-shadow">{round.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
