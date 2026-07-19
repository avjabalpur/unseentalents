"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { Slide } from "@/types/api";
import { mediaUrl } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi || slides.length < 2) return;
    const interval = setInterval(() => emblaApi.scrollNext(), 6500);
    return () => clearInterval(interval);
  }, [emblaApi, slides.length]);

  if (slides.length === 0) return null;

  return (
    <div className="relative overflow-hidden border-b border-white/10 bg-black">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, i) => {
            const desktopUrl = mediaUrl(slide.imageKey);
            const mobileUrl = mediaUrl(slide.mobileImageKey) ?? desktopUrl;
            const isActive = i === selectedIndex;
            const body = (
              <div className="relative h-[380px] w-full overflow-hidden sm:h-[560px] lg:h-[760px]">
                <picture>
                  {mobileUrl && <source media="(max-width: 640px)" srcSet={mobileUrl} />}
                  {desktopUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={isActive ? "active" : "inactive"}
                      src={desktopUrl}
                      alt={slide.title ?? ""}
                      className={cn("h-full w-full object-cover", isActive && "animate-kenburns")}
                    />
                  )}
                </picture>
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
                {(slide.title || slide.subtitle) && (
                  <div className="absolute bottom-0 left-0 max-w-xl p-6 sm:p-10">
                    {slide.title && (
                      <h2
                        key={`title-${isActive}`}
                        className={cn(
                          "text-2xl font-bold uppercase tracking-wide text-white drop-shadow-lg sm:text-4xl",
                          isActive && "animate-slide-up",
                        )}
                      >
                        {slide.title}
                      </h2>
                    )}
                    {slide.subtitle && (
                      <p
                        key={`subtitle-${isActive}`}
                        className={cn("mt-2 text-white/80 drop-shadow", isActive && "animate-slide-up-delayed")}
                      >
                        {slide.subtitle}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
            return (
              <div key={slide.id} className="min-w-0 flex-[0_0_100%]">
                {slide.linkUrl ? <Link href={slide.linkUrl}>{body}</Link> : body}
              </div>
            );
          })}
        </div>
      </div>
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => emblaApi?.scrollTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === selectedIndex ? "w-6 bg-primary" : "w-1.5 bg-white/40 hover:bg-white/60",
              )}
            />
          ))}
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center">
        <ChevronDown className="animate-scroll-cue size-7 text-white/70" />
      </div>
    </div>
  );
}
