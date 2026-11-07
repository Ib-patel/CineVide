"use client";

import { useRef } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { Check, Info, Play, Plus, Star } from "lucide-react";
import { canPlay, isTrailerOnly, type MediaSummary } from "@/types";
import { useModal } from "@/context/ModalContext";
import { useWatchlist } from "@/context/WatchlistContext";
import { useHoverPreview } from "@/context/HoverPreviewContext";
import { cn, formatCardMeta, formatRating } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { IconSwap } from "@/components/ui/IconSwap";
import { useSpotlight } from "@/lib/use-spotlight";

interface MediaCardProps {
  item: MediaSummary;
  className?: string;
  priority?: boolean;
  /** "row": fixed widths for horizontal rows. "grid": fills its grid cell. */
  layout?: "row" | "grid";
}

/**
 * Poster card. On mouse devices the rich hover preview (HoverPreview) carries
 * the actions; touch screens and keyboard focus get the in-card action bar.
 */
export function MediaCard({ item, className, priority, layout = "row" }: MediaCardProps) {
  const { openDetails, openPlayback } = useModal();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const preview = useHoverPreview();
  const cardRef = useRef<HTMLElement>(null);
  const spotlight = useSpotlight<HTMLElement>();
  const inList = isInWatchlist(item.id);
  const unavailable = item.availability !== "AVAILABLE";
  const playable = canPlay(item);
  const trailerOnly = isTrailerOnly(item);

  // Rows show landscape stills (16:9); browse grids keep the poster.
  const landscape = layout === "row";
  const meta = formatCardMeta(item.type, item.releaseYear, item.runtimeMinutes, item.seasonsCount);

  return (
    <article
      ref={cardRef}
      onPointerEnter={(event) => cardRef.current && preview.request(item, cardRef.current, event.pointerType)}
      onPointerMove={spotlight}
      onPointerLeave={preview.release}
      className={cn(
        "card-fx group flex-none snap-start overflow-hidden rounded-xl border border-white/[0.06] bg-card",
        "hover:border-white/20 focus-within:border-white/30",
        // Press feedback: the whole card dips when its main surface is pressed.
        "has-[>button:first-child:active]:scale-[0.98]",
        layout === "row" ? "w-[72%] sm:w-[248px] lg:w-[264px] xl:w-[280px]" : "w-full",
        className
      )}
    >
      <button
        type="button"
        onClick={() => {
          preview.dismiss();
          openDetails(item);
        }}
        aria-label={`More info about ${item.title}`}
        className="absolute inset-0 z-10 cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset"
      />

      <div className={cn("relative w-full overflow-hidden rounded-t-xl bg-white/[0.03]", landscape ? "aspect-video" : "aspect-[2/3]")}>
        <SafeImage
          fallbackTitle={item.title}
          src={landscape ? item.backdropUrl || item.posterUrl : item.posterUrl}
          alt={landscape ? `${item.title} still` : `${item.title} poster`}
          fill
          sizes={landscape ? "(max-width: 640px) 72vw, 280px" : "(max-width: 640px) 44vw, 212px"}
          className={cn(
            "object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:group-hover:scale-100",
            !playable && "opacity-60 saturate-50"
          )}
          loading={priority ? "eager" : "lazy"}
          priority={priority}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-night/90 via-night/5 to-transparent" />
        {item.isExclusive ? (
          <Badge variant="accent" className="absolute top-2 left-2 z-10">
            Original
          </Badge>
        ) : null}
        {unavailable ? (
          <Badge variant="outline" className="absolute top-2 right-2 z-10 bg-night/70 backdrop-blur-sm">
            {trailerOnly ? "New" : item.availability === "METADATA_ONLY" ? "Catalog" : "Soon"}
          </Badge>
        ) : null}

      </div>

      <div className="relative space-y-0.5 px-3 pt-2 pb-3 [@media(hover:none)]:pb-14">
        <h3 className="truncate font-display text-sm font-semibold tracking-[-0.01em] text-ink">{item.title}</h3>
        <p className="flex items-center gap-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1 text-gold">
            <Star className="size-3 fill-gold" aria-hidden />
            {formatRating(item.rating)}
          </span>
          <span aria-hidden>·</span>
          <span className="truncate">{meta}</span>
        </p>
      </div>

      {/* Touch screens: always visible. Mouse: hidden (preview has the actions) unless keyboard focus is inside. */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-1.5 p-3 pt-0",
          "[@media(hover:hover)]:pointer-events-none [@media(hover:hover)]:opacity-0",
          "[@media(hover:hover)]:group-focus-within:pointer-events-auto [@media(hover:hover)]:group-focus-within:opacity-100",
          "transition-opacity duration-150 ease-out"
        )}
      >
        <button
          type="button"
          onClick={() => toggleWatchlist(item)}
          aria-pressed={inList}
          aria-label={inList ? `Remove ${item.title} from My List` : `Add ${item.title} to My List`}
          className={cn(
            "pressable inline-flex size-9 cursor-pointer items-center justify-center rounded-full border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
            inList ? "border-gold/60 bg-gold/20 text-gold" : "border-white/25 bg-night/60 text-ink"
          )}
        >
          <IconSwap show={inList} className="size-4" on={<Check className="size-4" />} off={<Plus className="size-4" />} />
        </button>
        <button
          type="button"
          onClick={() => openDetails(item)}
          aria-label={`More info about ${item.title}`}
          className="pressable inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-night/60 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Info className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => openPlayback(item)}
          disabled={!playable}
          aria-label={
            trailerOnly ? `Play the ${item.title} trailer` : playable ? `Play ${item.title}` : `${item.title} is not streamable`
          }
          className="pressable inline-flex size-9 cursor-pointer items-center justify-center rounded-full bg-white text-night hover:bg-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Play className="size-4 fill-current" aria-hidden />
        </button>
      </div>
    </article>
  );
}
