"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import type { ContinueWatchingEntry } from "@/types";
import { useModal } from "@/context/ModalContext";
import { formatCardMeta, formatClock, formatRemaining } from "@/lib/utils";

interface ContinueWatchingCardProps {
  entry: ContinueWatchingEntry;
  isDemoData?: boolean;
}

export function ContinueWatchingCard({ entry, isDemoData }: ContinueWatchingCardProps) {
  const item = entry.media;
  const { openDemoPreview } = useModal();
  const percent = entry.durationSeconds
    ? Math.min(100, Math.round((entry.progressSeconds / entry.durationSeconds) * 100))
    : 0;

  const meta = formatCardMeta(item.type, item.releaseYear, item.runtimeMinutes, item.seasonsCount);

  const resume = () => {
    openDemoPreview(item, { entry });
  };

  return (
    <article className="group relative w-[76%] flex-none overflow-hidden rounded-xl border border-white/5 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_18px_45px_-12px_rgba(0,0,0,0.85)] sm:w-[300px] md:w-[280px] lg:w-[304px]">
      <div className="relative aspect-video w-full overflow-hidden">
        <Image
          src={item.backdropUrl}
          alt={`${item.title} backdrop`}
          fill
          sizes="(max-width: 640px) 76vw, 304px"
          className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.05]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-night via-night/35 to-transparent" />
        <span className="absolute top-2.5 right-2.5 z-10 rounded bg-night/80 px-1.5 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-sm">
          {formatRemaining(entry.progressSeconds, entry.durationSeconds)}
        </span>
        <div className="absolute inset-0 z-10 flex items-center justify-center opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <button
            type="button"
            onClick={resume}
            aria-label={`Resume ${item.title}${entry.episode ? `, episode ${entry.episode.episodeNumber}` : ""}`}
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-night/70 text-white backdrop-blur-md transition-colors hover:bg-accent hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
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
        {isDemoData ? (
          <p className="text-[10px] text-subtle" aria-hidden>
            Demo progress data
          </p>
        ) : null}
        <div
          role="progressbar"
          aria-label={`${item.title} playback progress`}
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1 w-full overflow-hidden rounded-full bg-white/15"
        >
          <div
            className="h-full rounded-full bg-accent shadow-[0_0_8px_rgba(229,9,20,0.7)]"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </article>
  );
}
