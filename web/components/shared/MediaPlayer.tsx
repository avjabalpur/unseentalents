"use client";

import dynamic from "next/dynamic";
import type { MediaType } from "@/types/api";
import { cn } from "@/lib/utils";

// Plyr touches `document` at import time, which breaks Next.js's static
// prerendering — load it client-only.
const Plyr = dynamic(() => import("plyr-react").then((mod) => mod.Plyr), { ssr: false });

interface MediaPlayerProps {
  mediaType: MediaType;
  videoUrl: string | null;
  imageUrl: string | null;
  posterUrl?: string | null;
  alt?: string;
  className?: string;
}

export function MediaPlayer({ mediaType, videoUrl, imageUrl, posterUrl, alt, className }: MediaPlayerProps) {
  if (mediaType === "IMAGE") {
    return imageUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt={alt ?? ""} className={cn("h-full w-full object-cover", className)} />
    ) : (
      <div className={cn("flex h-full w-full items-center justify-center bg-muted", className)} />
    );
  }

  if (!videoUrl) {
    return <div className={cn("flex h-full w-full items-center justify-center bg-muted", className)} />;
  }

  return (
    <div className={cn("h-full w-full overflow-hidden [&_.plyr]:h-full", className)}>
      <Plyr
        source={{
          type: "video",
          sources: [{ src: videoUrl, type: "video/mp4" }],
          poster: posterUrl ?? undefined,
        }}
        options={{
          controls: ["play-large", "play", "progress", "current-time", "duration", "mute", "volume", "settings", "fullscreen"],
          settings: ["speed"],
          resetOnEnd: true,
        }}
      />
    </div>
  );
}
