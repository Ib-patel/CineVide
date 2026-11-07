"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type PanInfo,
  type Variants,
} from "framer-motion";
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
import { isTrailerOnly, type MediaDetail } from "@/types";
import { useModal } from "@/context/ModalContext";
import { useWatchlist } from "@/context/WatchlistContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IconSwap } from "@/components/ui/IconSwap";
import { cn, formatCardMeta, formatRating } from "@/lib/utils";

const ROTATE_INTERVAL_MS = 11000;
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/*
 * Choreography: the copy block exits fast (the user is waiting on the next
 * title) and enters as a short cascade — badge, title, meta, synopsis, CTAs —
 * so the eye is led down the hierarchy instead of everything popping at once.
 */
const copyVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
  exit: { opacity: 0, transition: { duration: 0.16, ease: "easeOut" } },
};

const lineVariants: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: EASE_OUT },
  },
};

const reducedLineVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
};

interface HeroBillboardProps {
  featured: { media: MediaDetail; previewVideoUrl: string | null }[];
}

export function HeroBillboard({ featured }: HeroBillboardProps) {
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const { openDetails, openPlayback, isOpen: modalOpen } = useModal();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const sectionRef = useRef<HTMLElement>(null);

  const count = featured.length;
  const entry = featured[index] ?? featured[0];
  const item = entry?.media;
  const videoUrl = entry?.previewVideoUrl ?? null;
  const autoAdvance = !prefersReducedMotion && count > 1;

  useEffect(() => {
    if (isPaused || !autoAdvance) return;
    const timer = window.setTimeout(() => setIndex((prev) => (prev + 1) % count), ROTATE_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [isPaused, autoAdvance, count, index]);

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count]
  );

  // Arrow keys switch slides only while focus is inside the hero, so they never
  // hijack arrow navigation elsewhere on the page.
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowLeft") goTo(index - 1);
    else if (event.key === "ArrowRight") goTo(index + 1);
  };

  // Swipe on touch: a quick flick is enough (velocity), or a deliberate drag.
  const onPanEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.y) > Math.abs(info.offset.x)) return;
    if (info.offset.x < -60 || info.velocity.x < -400) goTo(index + 1);
    else if (info.offset.x > 60 || info.velocity.x > 400) goTo(index - 1);
  };

  if (!item) return null;

  const inList = isInWatchlist(item.id);
  const line = prefersReducedMotion ? reducedLineVariants : lineVariants;

  return (
    <motion.section
      ref={sectionRef}
      aria-roledescription="carousel"
      aria-label="Featured titles"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(event) => {
        if (!sectionRef.current?.contains(event.relatedTarget as Node)) setIsPaused(false);
      }}
      onKeyDown={onKeyDown}
      onPanEnd={onPanEnd}
      style={{ touchAction: "pan-y" }}
      className={cn(
        "relative min-h-[80vh] w-full overflow-hidden sm:min-h-[88vh]",
        isPaused && "hero-paused"
      )}
    >
      <BackdropLayer
        item={item}
        slideKey={`${item.id}-${index}`}
        // Unload the preview while a modal/player is open so the film gets all the bandwidth.
        videoUrl={prefersReducedMotion || modalOpen ? null : videoUrl}
        muted={muted}
        animate={!prefersReducedMotion}
      />

      {/* Legibility scrims: a left vignette for the copy, a floor fade into the rows. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(90deg,rgb(7_7_10/0.94)_0%,rgb(7_7_10/0.6)_38%,transparent_70%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-night via-night/60 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-night/70 to-transparent"
      />

      <div className="relative z-10 flex min-h-[80vh] items-end px-4 pb-20 sm:min-h-[88vh] sm:px-10 md:pb-24">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={item.id}
            variants={copyVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="flex max-w-2xl flex-col gap-4 lg:max-w-3xl"
          >
            <motion.div variants={line} className="flex flex-wrap items-center gap-2">
              {item.isExclusive ? <Badge variant="accent">Cinevide Original</Badge> : null}
              <span className="text-[11px] font-semibold tracking-[0.2em] text-white/60 uppercase">
                {item.type === "series" ? "Series" : "Film"} · {item.genres.slice(0, 2).join(" · ")}
              </span>
            </motion.div>

            <motion.h1
              variants={line}
              className="text-glow font-display text-[2.6rem] leading-[1.02] font-bold tracking-[-0.03em] text-balance text-ink sm:text-6xl md:text-7xl"
            >
              {item.title}
            </motion.h1>

            {item.tagline ? (
              <motion.p
                variants={line}
                className="text-glow font-display text-base text-white/75 italic sm:text-lg"
              >
                {item.tagline}
              </motion.p>
            ) : null}

            <motion.div variants={line} className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              <span className="inline-flex items-center gap-1 font-semibold text-gold">
                <Star className="size-4 fill-gold" aria-hidden />
                {formatRating(item.rating)}
              </span>
              <span className="font-semibold text-emerald-400">{item.matchPercent}% Match</span>
              <span className="rounded border border-white/30 px-1.5 py-px text-xs text-white/90">
                {item.ageRating}
              </span>
              <span className="hidden text-white/70 sm:inline">
                {formatCardMeta(item.type, item.releaseYear, item.runtimeMinutes, item.seasonsCount)}
              </span>
              {isTrailerOnly(item) ? (
                <Badge variant="outline">New release</Badge>
              ) : (
                <Badge variant="hdr">{item.maxResolution}</Badge>
              )}
              {item.audioFormats.includes("Dolby Atmos") ? <Badge variant="outline">Atmos</Badge> : null}
            </motion.div>

            <motion.p
              variants={line}
              className="line-clamp-3 max-w-xl text-sm leading-relaxed text-pretty text-white/80 sm:text-base"
            >
              {item.synopsis}
            </motion.p>

            <motion.div variants={line} className="mt-2 flex flex-wrap items-center gap-3">
              <Button size="lg" variant="light" onClick={() => openPlayback(item)}>
                <Play className="size-5 fill-current" aria-hidden />
                {isTrailerOnly(item) ? "Play Trailer" : "Watch Now"}
              </Button>
              <Button size="lg" variant="glass" onClick={() => openDetails(item)}>
                <Info className="size-5" aria-hidden />
                More Info
              </Button>
              <RoundToggle
                pressed={inList}
                onClick={() => toggleWatchlist(item)}
                label={inList ? `Remove ${item.title} from My List` : `Add ${item.title} to My List`}
                active="border-gold/60 bg-gold/20 text-gold"
              >
                <IconSwap show={inList} on={<Check className="size-5" />} off={<Plus className="size-5" />} />
              </RoundToggle>
              {videoUrl && !prefersReducedMotion ? (
                <RoundToggle
                  pressed={!muted}
                  onClick={() => setMuted((prev) => !prev)}
                  label={muted ? "Unmute preview" : "Mute preview"}
                  active="border-white/60 bg-white/20 text-white"
                >
                  <IconSwap show={!muted} on={<Volume2 className="size-5" />} off={<VolumeX className="size-5" />} />
                </RoundToggle>
              ) : null}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {count > 1 ? (
        <div className="absolute right-4 bottom-8 z-20 flex items-center gap-3 md:right-10 md:bottom-10">
          <HeroArrow direction="left" onClick={() => goTo(index - 1)} />
          <div className="flex items-center gap-1.5" role="group" aria-label="Choose featured title">
            {featured.map((f, i) => {
              const active = i === index;
              return (
                <button
                  key={f.media.id}
                  type="button"
                  aria-current={active ? "true" : undefined}
                  aria-label={`Show ${f.media.title}`}
                  onClick={() => goTo(i)}
                  className={cn(
                    "relative h-1.5 cursor-pointer overflow-hidden rounded-full bg-white/25 transition-[width,background-color] duration-300 ease-out hover:bg-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                    active ? "w-9" : "w-3"
                  )}
                >
                  {active ? (
                    autoAdvance ? (
                      <span
                        key={`fill-${index}`}
                        aria-hidden
                        style={{ "--hero-duration": `${ROTATE_INTERVAL_MS}ms` } as CSSProperties}
                        className="hero-progress absolute inset-0 rounded-full bg-white"
                      />
                    ) : (
                      <span aria-hidden className="absolute inset-0 rounded-full bg-white" />
                    )
                  ) : null}
                </button>
              );
            })}
          </div>
          <HeroArrow direction="right" onClick={() => goTo(index + 1)} />
        </div>
      ) : null}
    </motion.section>
  );
}

function HeroArrow({ direction, onClick }: { direction: "left" | "right"; onClick: () => void }) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "left" ? "Previous featured title" : "Next featured title"}
      className="pressable hidden size-9 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-night/60 text-white/80 backdrop-blur-md hover:border-white/40 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:inline-flex"
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
}

function RoundToggle({
  pressed,
  onClick,
  label,
  active,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  label: string;
  active: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      aria-label={label}
      className={cn(
        "pressable inline-flex size-12 cursor-pointer items-center justify-center rounded-full border backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
        pressed ? active : "border-white/25 bg-white/10 text-white hover:border-white/50 hover:bg-white/15"
      )}
    >
      {children}
    </button>
  );
}

function BackdropLayer({
  item,
  slideKey,
  videoUrl,
  muted,
  animate,
}: {
  item: MediaDetail;
  slideKey: string;
  videoUrl: string | null;
  muted: boolean;
  animate: boolean;
}) {
  return (
    <div className="absolute inset-0 bg-night" aria-hidden>
      {/* No mode="wait": the outgoing and incoming backdrops overlap, so there is never a black frame. */}
      <AnimatePresence initial={false}>
        <motion.div
          key={slideKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.77, 0, 0.175, 1] }}
          className="absolute inset-0 overflow-hidden"
        >
          <div className={cn("absolute inset-0", animate && "animate-kenburns")}>
            <SafeImage
              src={item.backdropUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-[center_25%]"
            />
          </div>
          {videoUrl ? <PreviewVideo src={videoUrl} muted={muted} /> : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** How long a slide must be on screen before its preview starts downloading. */
const PREVIEW_DELAY_MS = 2200;

/**
 * Starts loading only after the slide has been on screen for a moment (like
 * Netflix trailers), so skimming the carousel doesn't burn bandwidth, and fades
 * in once it can actually play, so the still never flashes to black.
 */
function PreviewVideo({ src, muted }: { src: string; muted: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setArmed(true), PREVIEW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = muted;
  }, [muted]);

  if (!armed) return null;

  return (
    <video
      ref={videoRef}
      className={cn(
        "absolute inset-0 size-full object-cover transition-opacity duration-700 ease-out",
        ready ? "opacity-100" : "opacity-0"
      )}
      src={src}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      onPlaying={() => setReady(true)}
    />
  );
}
