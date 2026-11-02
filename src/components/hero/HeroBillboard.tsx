"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  Play,
  Plus,
  Star,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { MediaDetail } from "@/types";
import { useModal } from "@/context/ModalContext";
import { useWatchlist } from "@/context/WatchlistContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, formatCardMeta, formatRating } from "@/lib/utils";

const ROTATE_INTERVAL_MS = 11000;

interface HeroBillboardProps {
  featured: { media: MediaDetail; previewVideoUrl: string | null }[];
}

export function HeroBillboard({ featured }: HeroBillboardProps) {
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const { openDetails, openDemoPreview } = useModal();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  const item = featured[index]?.media ?? featured[0]?.media;
  const videoUrl = item
    ? (featured.find((entry) => entry.media.id === item.id)?.previewVideoUrl ?? null)
    : null;

  useEffect(() => {
    if (isPaused || prefersReducedMotion || (featured.length ?? 0) <= 1) return;
    const timer = window.setInterval(
      () => setIndex((prev) => (prev + 1) % featured.length),
      ROTATE_INTERVAL_MS
    );
    return () => window.clearInterval(timer);
  }, [isPaused, prefersReducedMotion, featured.length]);

  const shift = useCallback(
    (dir: 1 | -1) => {
      setIndex((prev) => (prev + dir + featured.length) % featured.length);
      setIsPaused(true);
    },
    [featured.length]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.matches("input, select, textarea") || target.closest('[role="dialog"]'))
      ) {
        return;
      }
      shift(event.key === "ArrowLeft" ? -1 : 1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shift]);

  if (!item) return null;

  const inList = isInWatchlist(item.id);

  return (
    <section
      aria-label="Featured titles"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative min-h-[78vh] w-full overflow-hidden sm:min-h-[85vh]"
    >
      <BackdropLayer
        item={item}
        videoUrl={prefersReducedMotion ? null : videoUrl}
        muted={muted}
        k={index}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-night/95 via-night/55 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-night via-night/55 to-transparent"
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative z-10 flex min-h-[78vh] max-w-2xl flex-col justify-end gap-4 px-4 pb-16 sm:min-h-[85vh] sm:px-10 md:pb-20 lg:max-w-3xl"
        >
          {item.isExclusive ? <Badge variant="accent">Cinevide Exclusive</Badge> : null}
          <h1 className="text-glow font-display text-4xl leading-tight font-bold tracking-tight text-ink sm:text-5xl md:text-6xl">
            {item.title}
          </h1>
          {item.tagline ? (
            <p className="text-glow font-display text-sm italic text-white/80">{item.tagline}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-1 font-semibold text-gold">
              <Star className="size-4 fill-gold" aria-hidden />
              {formatRating(item.rating)}
            </span>
            <span className="font-semibold text-emerald-400">{item.matchPercent}% Match</span>
            <span className="border border-white/30 px-1.5 py-px text-xs text-white/90">
              {item.ageRating}
            </span>
            <span className="hidden text-muted sm:inline">
              {formatCardMeta(item.type, item.releaseYear, item.runtimeMinutes, item.seasonsCount)}
            </span>
            <Badge variant="hdr">{item.maxResolution}</Badge>
            {item.audioFormats.includes("Dolby Atmos") ? (
              <Badge variant="outline">Atmos</Badge>
            ) : null}
          </div>

          <p className="line-clamp-3 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
            {item.synopsis}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={() => openDemoPreview(item)}>
              <Play className="size-5 fill-current" aria-hidden />
              {item.type === "series" ? "Play" : "Play"}
            </Button>
            <Button size="lg" variant="glass" onClick={() => openDetails(item)}>
              <Info className="size-5" aria-hidden />
              More Info
            </Button>
            <button
              type="button"
              onClick={() => toggleWatchlist(item)}
              aria-pressed={inList}
              aria-label={inList ? `Remove ${item.title} from My List` : `Add ${item.title} to My List`}
              className={cn(
                "inline-flex size-11 cursor-pointer items-center justify-center rounded-full border backdrop-blur-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                inList
                  ? "border-gold/60 bg-gold/25 text-gold"
                  : "border-white/25 bg-white/10 text-white hover:border-white/50"
              )}
            >
              {inList ? <Check className="size-5" aria-hidden /> : <Plus className="size-5" aria-hidden />}
            </button>
            <button
              type="button"
              onClick={() => setMuted((prev) => !prev)}
              aria-pressed={!muted}
              aria-label={muted ? "Unmute preview" : "Mute preview"}
              className={cn(
                "inline-flex size-11 cursor-pointer items-center justify-center rounded-full border backdrop-blur-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                muted
                  ? "border-white/25 bg-white/10 text-white hover:border-white/50"
                  : "border-accent bg-accent/90 text-white hover:bg-accent-hover"
              )}
            >
              {muted ? <VolumeX className="size-5" aria-hidden /> : <Volume2 className="size-5" aria-hidden />}
            </button>
          </div>

          <p className="text-[11px] text-subtle">
            Preview loop uses licensed demo footage — full titles are not available in this demo.
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="absolute right-4 bottom-16 z-20 flex items-center gap-2 md:right-10 md:bottom-20">
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label="Previous featured title"
          className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-night/70 text-white/80 backdrop-blur-md transition-colors hover:border-white/40 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Featured titles">
          {featured.map((f, i) => (
            <button
              key={f.media.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show ${f.media.title}`}
              onClick={() => {
                setIndex(i);
                setIsPaused(true);
              }}
              className={cn(
                "h-1.5 cursor-pointer rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                i === index ? "w-7 bg-accent" : "w-3 bg-white/30 hover:bg-white/60"
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="Next featured title"
          className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-night/70 text-white/80 backdrop-blur-md transition-colors hover:border-white/40 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </section>
  );
}

function BackdropLayer({
  item,
  videoUrl,
  muted,
  k,
}: {
  item: MediaDetail;
  videoUrl: string | null;
  muted: boolean;
  k: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
  }, [muted]);

  return (
    <div className="absolute inset-0" aria-hidden>
      <AnimatePresence>
        <motion.div
          key={k}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={item.backdropUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-night/40" />
          {videoUrl ? (
            <video
              ref={videoRef}
              className="absolute inset-0 size-full object-cover"
              src={videoUrl}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
            />
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
