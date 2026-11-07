"use client";

import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { SafeImage } from "@/components/ui/SafeImage";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, Play, Plus, Star } from "lucide-react";
import { IconSwap } from "@/components/ui/IconSwap";
import type { PreviewAnchor } from "@/context/HoverPreviewContext";
import { useModal } from "@/context/ModalContext";
import { useWatchlist } from "@/context/WatchlistContext";
import { useToast } from "@/context/ToastContext";
import { Badge } from "@/components/ui/Badge";
import { cn, formatCardMeta, formatRating } from "@/lib/utils";
import { canPlay, isTrailerOnly } from "@/types";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const VIEWPORT_GUTTER = 12;
const HEADER_CLEARANCE = 76;

interface HoverPreviewProps {
  anchor: PreviewAnchor | null;
  onHold: () => void;
  onRelease: () => void;
  onDismiss: () => void;
}

const noopSubscribe = () => () => {};

export function HoverPreview({ anchor, onHold, onRelease, onDismiss }: HoverPreviewProps) {
  // Only portal on the client (false during SSR and hydration), so markup always matches.
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!isClient) return null;
  return createPortal(
    <AnimatePresence>
      {anchor ? (
        <PreviewCard
          key={anchor.item.id}
          anchor={anchor}
          onHold={onHold}
          onRelease={onRelease}
          onDismiss={onDismiss}
        />
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

function PreviewCard({
  anchor,
  onHold,
  onRelease,
  onDismiss,
}: {
  anchor: PreviewAnchor;
  onHold: () => void;
  onRelease: () => void;
  onDismiss: () => void;
}) {
  const { item, rect, warm } = anchor;
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { openDetails, openPlayback } = useModal();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { showToast } = useToast();
  const inList = isInWatchlist(item.id);
  const unavailable = item.availability !== "AVAILABLE";
  const playable = canPlay(item);
  const trailerOnly = isTrailerOnly(item);

  const width = Math.round(Math.min(360, Math.max(300, rect.width * 1.6)));
  const left = Math.round(
    Math.min(
      Math.max(VIEWPORT_GUTTER, rect.left + rect.width / 2 - width / 2),
      window.innerWidth - width - VIEWPORT_GUTTER
    )
  );
  const [top, setTop] = useState(() => Math.max(HEADER_CLEARANCE, rect.top - 24));

  // Measure the real height before paint and keep the card fully on screen.
  // offsetHeight ignores transforms, so the entrance scale doesn't skew it.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const height = el.offsetHeight;
    const centred = rect.top + rect.height / 2 - height / 2;
    const maxTop = window.innerHeight - height - VIEWPORT_GUTTER;
    setTop(Math.round(Math.max(HEADER_CLEARANCE, Math.min(centred, maxTop))));
  }, [rect]);

  // Grow out of the card itself, not out of the preview's own centre.
  const originX = rect.left + rect.width / 2 - left;
  const originY = rect.top + rect.height / 2 - top;
  const fromScale = Math.min(0.92, rect.width / width);

  const grow = !warm && !reduceMotion;

  const meta = formatCardMeta(item.type, item.releaseYear, item.runtimeMinutes, item.seasonsCount);

  const act = (fn: () => void) => () => {
    onDismiss();
    fn();
  };

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-label={`${item.title} preview`}
      onPointerEnter={onHold}
      onPointerLeave={onRelease}
      initial={grow ? { opacity: 0, scale: fromScale } : { opacity: 0 }}
      animate={{ opacity: 1, scale: 1, transition: { duration: grow ? 0.22 : 0.12, ease: EASE_OUT } }}
      exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.96, transition: { duration: 0.14, ease: "easeOut" } }}
      style={{ left, top, width, transformOrigin: `${originX}px ${originY}px` }}
      className="fixed z-[90] overflow-hidden rounded-2xl border border-white/10 bg-elevated shadow-[0_30px_80px_-20px_rgb(0_0_0/0.95),0_0_0_1px_rgb(255_255_255/0.04)]"
    >
      <button
        type="button"
        onClick={act(() => openDetails(item))}
        aria-label={`More info about ${item.title}`}
        className="relative block aspect-video w-full cursor-pointer overflow-hidden"
      >
        <SafeImage
          src={item.backdropUrl}
          alt=""
          fill
          sizes="360px"
          className={cn("object-cover", !playable && "opacity-70")}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-elevated via-elevated/10 to-transparent" />
        <p className="absolute bottom-2 left-3 right-3 truncate text-left font-display text-lg font-bold tracking-tight text-ink text-glow">
          {item.title}
        </p>
      </button>

      <div className="space-y-2.5 p-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={act(() => openPlayback(item))}
            disabled={!playable}
            aria-label={
              trailerOnly ? `Play the ${item.title} trailer` : playable ? `Play ${item.title}` : `${item.title} is not streamable`
            }
            className="pressable inline-flex size-9 cursor-pointer items-center justify-center rounded-full bg-white text-night hover:bg-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Play className="size-4 fill-current" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => {
              const added = toggleWatchlist(item);
              showToast(added ? `Added "${item.title}" to My List` : `Removed "${item.title}" from My List`);
            }}
            aria-pressed={inList}
            aria-label={inList ? `Remove ${item.title} from My List` : `Add ${item.title} to My List`}
            className={cn(
              "pressable inline-flex size-9 cursor-pointer items-center justify-center rounded-full border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
              inList ? "border-gold/60 bg-gold/15 text-gold" : "border-white/30 text-ink hover:border-white"
            )}
          >
            <IconSwap show={inList} className="size-4" on={<Check className="size-4" />} off={<Plus className="size-4" />} />
          </button>
          <button
            type="button"
            onClick={act(() => openDetails(item))}
            aria-label={`More info about ${item.title}`}
            className="pressable ml-auto inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-white/30 text-ink hover:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronDown className="size-4" aria-hidden />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="font-semibold text-emerald-400">{item.matchPercent}% Match</span>
          <span className="rounded border border-white/25 px-1 py-px text-[10px] text-white/80">
            {item.ageRating}
          </span>
          <span className="text-muted">{meta}</span>
          <span className="inline-flex items-center gap-0.5 text-gold">
            <Star className="size-3 fill-gold" aria-hidden />
            {formatRating(item.rating)}
          </span>
          <Badge variant="hdr" className="px-1.5 py-0 text-[9px]">
            {item.maxResolution}
          </Badge>
        </div>

        <p className="truncate text-xs text-white/75">
          {item.genres.slice(0, 3).join(" • ")}
        </p>

        {unavailable ? (
          <p className="text-[11px] text-subtle">
            {trailerOnly
              ? "Trailer here · full title on the services in More info"
              : item.availability === "METADATA_ONLY"
                ? "Catalog info only — not streamable"
                : "Coming soon"}
          </p>
        ) : null}
      </div>
    </motion.div>
  );
}
