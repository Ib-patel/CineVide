"use client";

import { useState } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { Play, X } from "lucide-react";
import type { ContinueWatchingEntry } from "@/types";
import { useModal } from "@/context/ModalContext";
import { useToast } from "@/context/ToastContext";
import { progressApi } from "@/lib/api-client";
import { useSpotlight } from "@/lib/use-spotlight";
import { formatCardMeta, formatClock, formatRemaining } from "@/lib/utils";

interface ContinueWatchingCardProps {
  entry: ContinueWatchingEntry;
}

export function ContinueWatchingCard({ entry }: ContinueWatchingCardProps) {
  const item = entry.media;
  const { openPlayback } = useModal();
  const { showToast } = useToast();
  const [removed, setRemoved] = useState(false);

  const percent = entry.durationSeconds
    ? Math.min(100, Math.round((entry.progressSeconds / entry.durationSeconds) * 100))
    : 0;

  const meta = formatCardMeta(item.type, item.releaseYear, item.runtimeMinutes, item.seasonsCount);
  const spotlight = useSpotlight<HTMLElement>();

  const resume = () => {
    openPlayback(item, {
      entry,
      episodeId: entry.episode?.id,
      seasonNumber: entry.episode?.seasonNumber,
      episodeNumber: entry.episode?.episodeNumber,
    });
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setRemoved(true);
    await progressApi.delete(item.id);
    showToast(`Removed "${item.title}" from Continue Watching`);
  };

  if (removed) return null;

  return (
    <article onPointerMove={spotlight} className="card-fx group w-[76%] flex-none snap-start overflow-hidden rounded-xl border border-white/[0.06] bg-card hover:border-white/20 focus-within:border-white/30 sm:w-[300px] md:w-[280px] lg:w-[304px]">
      <div className="relative aspect-video w-full overflow-hidden">
        <SafeImage
          fallbackTitle={item.title}
          src={item.backdropUrl}
          alt={`${item.title} backdrop`}
          fill
          sizes="(max-width: 640px) 76vw, 304px"
          className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:group-hover:scale-100"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-night via-night/35 to-transparent" />
        <button
          type="button"
          onClick={handleRemove}
          aria-label={`Remove ${item.title} from continue watching`}
          className="pressable absolute top-2.5 left-2.5 z-20 inline-flex size-7 cursor-pointer items-center justify-center rounded-full bg-night/80 text-white/70 backdrop-blur-sm hover:bg-white hover:text-night focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
        >
          <X className="size-3.5" />
        </button>
        <span className="absolute top-2.5 right-2.5 z-10 rounded bg-night/80 px-1.5 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-sm">
          {formatRemaining(entry.progressSeconds, entry.durationSeconds)}
        </span>
        <div className="absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-200 ease-out [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100">
          <button
            type="button"
            onClick={resume}
            aria-label={`Resume ${item.title}${entry.episode ? `, episode ${entry.episode.episodeNumber}` : ""}`}
            className="pressable inline-flex size-12 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-night/60 text-white backdrop-blur-md hover:border-white hover:bg-white hover:text-night focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Play className="size-5 fill-current" aria-hidden />
          </button>
        </div>
      </div>

      <div className="relative z-20 space-y-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate font-display text-sm font-semibold text-ink">{item.title}</h3>
          <span className="shrink-0 text-[11px] text-subtle">
            {formatClock(Math.max(0, entry.durationSeconds - entry.progressSeconds))}
          </span>
        </div>
        <p className="truncate text-xs text-muted">
          {entry.episode
            ? `S${String(entry.episode.seasonNumber).padStart(2, "0")}:E${String(entry.episode.episodeNumber).padStart(2, "0")} · ${entry.episode.title}`
            : meta}
        </p>
        <div
          role="progressbar"
          aria-label={`${item.title} playback progress`}
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1 w-full overflow-hidden rounded-full bg-white/15"
        >
          <div
            className="bg-projector h-full rounded-full shadow-[0_0_10px_rgb(242_181_68/0.45)]"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </article>
  );
}
