"use client";

import Image from "next/image";
import { Info } from "lucide-react";
import type { MediaSummary } from "@/types";
import { useModal } from "@/context/ModalContext";
import { cn, formatCardMeta, formatRating } from "@/lib/utils";

interface RankedMediaCardProps {
  item: MediaSummary;
  rank: number;
}

export function RankedMediaCard({ item, rank }: RankedMediaCardProps) {
  const { openDetails } = useModal();
  const meta = formatCardMeta(item.type, item.releaseYear, item.runtimeMinutes, item.seasonsCount);

  return (
    <article className="group flex w-[62%] flex-none items-end sm:w-[300px] md:w-[280px]">
      <span
        aria-hidden
        className="rank-stroke relative z-0 -mr-7 mb-1 font-display text-7xl leading-none font-black select-none sm:-mr-9 sm:text-8xl md:-mr-10 md:text-[8.5rem]"
      >
        {rank}
      </span>
      <button
        type="button"
        onClick={() => openDetails(item)}
        aria-label={`More info about ${item.title}, ranked number ${rank} in trending`}
        className="relative z-10 w-[112px] cursor-pointer overflow-hidden rounded-xl border border-white/10 shadow-lg shadow-black/50 transition-all duration-300 hover:-translate-y-1 hover:border-white/30 hover:shadow-[0_18px_45px_-10px_rgba(0,0,0,0.9)] md:w-[128px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <div className="relative aspect-[2/3] w-full">
          <Image
            src={item.posterUrl}
            alt={`${item.title} poster`}
            fill
            sizes="128px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-night/90 via-transparent to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-2 text-left transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <p className="truncate font-display text-xs font-semibold text-ink">{item.title}</p>
          <p className="truncate text-[10px] text-muted">
            {formatRating(item.rating)} · {meta}
          </p>
        </div>
        <Info
          aria-hidden
          className={cn(
            "absolute top-2 right-2 size-4 text-white/80 drop-shadow",
            "opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100"
          )}
        />
      </button>
    </article>
  );
}
