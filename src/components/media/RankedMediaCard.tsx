"use client";

import { useRef } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { Info } from "lucide-react";
import type { MediaSummary } from "@/types";
import { useModal } from "@/context/ModalContext";
import { useHoverPreview } from "@/context/HoverPreviewContext";
import { useSpotlight } from "@/lib/use-spotlight";
import { cn, formatCardMeta, formatRating } from "@/lib/utils";

interface RankedMediaCardProps {
  item: MediaSummary;
  rank: number;
}

export function RankedMediaCard({ item, rank }: RankedMediaCardProps) {
  const { openDetails } = useModal();
  const preview = useHoverPreview();
  const posterRef = useRef<HTMLButtonElement>(null);
  const spotlight = useSpotlight<HTMLButtonElement>();
  const meta = formatCardMeta(item.type, item.releaseYear, item.runtimeMinutes, item.seasonsCount);

  return (
    <article className="group flex flex-none snap-start items-end">
      <span
        aria-hidden
        className="rank-stroke relative z-0 transition-[-webkit-text-stroke-color] duration-300 ease-out group-hover:[-webkit-text-stroke-color:rgb(242_181_68/0.95)] -mr-1 mb-1 font-display text-7xl leading-none font-black tabular-nums select-none sm:-mr-1.5 sm:text-8xl md:-mr-2 md:text-[8.5rem]"
      >
        {rank}
      </span>
      <button
        ref={posterRef}
        type="button"
        onPointerEnter={(event) => posterRef.current && preview.request(item, posterRef.current, event.pointerType)}
        onPointerMove={spotlight}
        onPointerLeave={preview.release}
        onClick={() => {
          preview.dismiss();
          openDetails(item);
        }}
        aria-label={`More info about ${item.title}, ranked number ${rank} in trending`}
        className="card-fx z-10 w-[118px] cursor-pointer overflow-hidden rounded-xl border border-white/10 shadow-lg shadow-black/50 hover:border-white/30 active:scale-[0.98] md:w-[136px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <div className="relative aspect-[2/3] w-full">
          <SafeImage
            fallbackTitle={item.title}
            src={item.posterUrl}
            alt={`${item.title} poster`}
            fill
            sizes="136px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05] motion-reduce:group-hover:scale-100"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-night/90 via-transparent to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-2 text-left transition-opacity duration-150 ease-out [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100">
          <p className="truncate font-display text-xs font-semibold text-ink">{item.title}</p>
          <p className="truncate text-[10px] text-muted">
            {formatRating(item.rating)} · {meta}
          </p>
        </div>
        <Info
          aria-hidden
          className={cn(
            "absolute top-2 right-2 size-4 text-white/80 drop-shadow",
            "transition-opacity duration-150 ease-out [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100"
          )}
        />
      </button>
    </article>
  );
}
