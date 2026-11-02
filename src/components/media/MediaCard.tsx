"use client";

import Image from "next/image";
import { Check, Info, Play, Plus, Star } from "lucide-react";
import type { MediaSummary } from "@/types";
import { useModal } from "@/context/ModalContext";
import { useWatchlist } from "@/context/WatchlistContext";
import { cn, formatCardMeta, formatRating } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

interface MediaCardProps {
  item: MediaSummary;
  className?: string;
  priority?: boolean;
}

export function MediaCard({ item, className, priority }: MediaCardProps) {
  const { openDetails, openDemoPreview } = useModal();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const inList = isInWatchlist(item.id);
  const unavailable = item.availability !== "AVAILABLE";

  const meta = formatCardMeta(item.type, item.releaseYear, item.runtimeMinutes, item.seasonsCount);

  return (
    <article
      className={cn(
        "group relative flex-none overflow-hidden rounded-xl border border-white/5 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_18px_45px_-12px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.06)] focus-within:border-white/25",
        "w-[46%] sm:w-[196px] md:w-[184px] lg:w-[200px]",
        className
      )}
    >
      <button
        type="button"
        onClick={() => openDetails(item)}
        aria-label={`More info about ${item.title}`}
        className="absolute inset-0 z-10 cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      />

      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-t-xl">
        <Image
          src={item.posterUrl}
          alt={`${item.title} poster`}
          fill
          sizes="(max-width: 640px) 46vw, 200px"
          className={cn(
            "object-cover transition-transform duration-500 group-hover:scale-[1.06]",
            unavailable && "opacity-60"
          )}
          loading={priority ? "eager" : "lazy"}
          priority={priority}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-night/95 via-night/10 to-transparent" />
        {item.isExclusive ? (
          <Badge variant="accent" className="absolute top-2 left-2 z-10">
            Exclusive
          </Badge>
        ) : null}
        {unavailable ? (
          <Badge variant="outline" className="absolute top-2 right-2 z-10">
            Coming soon
          </Badge>
        ) : null}
      </div>

      <div className="relative z-20 space-y-0.5 px-3 pt-2 pb-24">
        <h3 className="truncate font-display text-sm font-semibold text-ink">{item.title}</h3>
        <p className="flex items-center gap-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1 text-gold">
            <Star className="size-3 fill-gold" aria-hidden />
            {formatRating(item.rating)}
          </span>
          <span aria-hidden>·</span>
          <span>{meta}</span>
        </p>
      </div>

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2 bg-gradient-to-t from-night via-night/80 to-transparent p-3 pt-6",
          "opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
        )}
      >
        <p className="hidden truncate text-[11px] text-subtle md:block">
          {item.genres.slice(0, 2).join(" · ")}
        </p>
        <div className="flex items-center justify-between gap-1.5">
          <button
            type="button"
            onClick={() => toggleWatchlist(item)}
            aria-pressed={inList}
            aria-label={inList ? `Remove ${item.title} from My List` : `Add ${item.title} to My List`}
            className={cn(
              "inline-flex size-8 cursor-pointer items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-night focus-visible:ring-offset-2 focus-visible:ring-offset-white",
              inList
                ? "border-gold/60 bg-gold/20 text-gold"
                : "border-white/25 bg-night/60 text-ink hover:border-white hover:bg-white hover:text-night"
            )}
          >
            {inList ? <Check className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
          </button>
          <button
            type="button"
            onClick={() => openDetails(item)}
            aria-label={`More info about ${item.title}`}
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-night/60 text-ink transition-colors hover:border-white hover:bg-white hover:text-night focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-night focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <Info className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => openDemoPreview(item)}
            disabled={unavailable}
            aria-label={unavailable ? `${item.title} is not available yet` : `Play demo preview of ${item.title}`}
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full bg-accent text-white shadow-md shadow-accent/30 transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-night focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Play className="size-4 fill-current" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}
