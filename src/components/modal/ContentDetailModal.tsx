"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, Play, RefreshCw, Star, X } from "lucide-react";
import type { MediaDetail, MediaSummary } from "@/types";
import { isSeriesDetail } from "@/types";
import { useModal } from "@/context/ModalContext";
import { useToast } from "@/context/ToastContext";
import { useWatchlist } from "@/context/WatchlistContext";
import { catalogApi } from "@/lib/api-client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { DemoPlayer } from "@/components/modal/DemoPlayer";
import { formatCardMeta, formatRating, formatRuntime } from "@/lib/utils";

export function ContentDetailModal() {
  const { isOpen, mode, selectedItem, playbackContext, closeModal } = useModal();
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
        return;
      }
      if (event.key === "Tab") {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const focusables = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, video, [tabindex]:not([tabindex="-1"])'
          )
        ).filter(
          (el) =>
            !el.hasAttribute("disabled") &&
            el.getAttribute("aria-hidden") !== "true" &&
            el.offsetParent !== null
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 30);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [isOpen, mode, closeModal]);

  return (
    <AnimatePresence>
      {isOpen && selectedItem ? (
        <motion.div
          className="fixed inset-0 z-[100] overflow-y-auto bg-night/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closeModal}
        >
          <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-6">
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label={
                mode === "demo" ? `Demo preview: ${selectedItem.title}` : `About ${selectedItem.title}`
              }
              data-title={selectedItem.title}
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(event) => event.stopPropagation()}
              className="relative w-full max-w-3xl overflow-hidden rounded-t-2xl bg-elevated shadow-2xl shadow-black/80 ring-1 ring-white/10 sm:rounded-2xl"
            >
              {mode === "demo" ? (
                <DemoPlayer
                  key={`demo:${selectedItem.id}`}
                  item={selectedItem}
                  playlist={playbackContext?.entry}
                  onClose={closeModal}
                />
              ) : (
                <DetailsView
                  key={`details:${selectedItem.id}`}
                  item={selectedItem}
                  onClose={closeModal}
                  closeRef={closeRef}
                />
              )}
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

type DetailState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; detail: MediaDetail };

function DetailsView({
  item,
  onClose,
  closeRef,
}: {
  item: MediaSummary;
  onClose: () => void;
  closeRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { showToast } = useToast();
  const { openDemoPreview } = useModal();
  const inList = isInWatchlist(item.id);
  const [state, setState] = useState<DetailState>({ status: "loading" });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const raf = requestAnimationFrame(() => {
      setState({ status: "loading" });
    });
    catalogApi
      .detailBySlug(item.slug, controller.signal)
      .then((detail) => {
        if (controller.signal.aborted) return;
        setState(detail ? { status: "ready", detail } : { status: "error" });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setState({ status: "error" });
      });
    return () => {
      cancelAnimationFrame(raf);
      controller.abort();
    };
  }, [item.slug, item.id, reloadToken]);

  const handleToggle = () => {
    const added = toggleWatchlist(item);
    showToast(added ? `Added "${item.title}" to My List` : `Removed "${item.title}" from My List`);
  };

  if (state.status === "error") {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="absolute top-3 right-3 inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-night/70 text-ink backdrop-blur-md transition-colors hover:bg-night focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X className="size-4" aria-hidden />
        </button>
        <p className="font-display text-lg font-semibold text-ink">
          “{item.title}” is unavailable right now
        </p>
        <p className="max-w-sm text-sm text-muted">
          We could not load the full details for this title. Check your connection and try again.
        </p>
        <Button variant="glass" onClick={() => setReloadToken((token) => token + 1)}>
          <RefreshCw className="size-4" aria-hidden />
          Retry
        </Button>
      </div>
    );
  }

  if (state.status === "loading") {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center gap-3 p-8">
        <Spinner />
        <p className="text-sm text-muted">Loading details…</p>
      </div>
    );
  }

  return <LoadedDetails detail={state.detail} onClose={onClose} closeRef={closeRef} onToggle={handleToggle} inList={inList} onPlay={() => openDemoPreview(item)} />;
}

function LoadedDetails({
  detail,
  onClose,
  closeRef,
  onToggle,
  inList,
  onPlay,
}: {
  detail: MediaDetail;
  onClose: () => void;
  closeRef: React.RefObject<HTMLButtonElement | null>;
  onToggle: () => void;
  inList: boolean;
  onPlay: () => void;
}) {
  const series = isSeriesDetail(detail) ? detail : null;
  const [selectedSeason, setSelectedSeason] = useState(0);
  const season = series ? series.seasons[selectedSeason] : null;

  return (
    <div className="max-h-[88vh] overflow-y-auto overscroll-contain">
      <div className="relative aspect-video w-full sm:aspect-[16/8]">
        <Image
          src={detail.backdropUrl}
          alt={`${detail.title} backdrop`}
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover object-top"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-elevated via-elevated/30 to-transparent" />
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="absolute top-3 right-3 z-20 inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-night/70 text-ink backdrop-blur-md transition-colors hover:bg-night focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X className="size-4" aria-hidden />
        </button>

        <div className="absolute right-4 bottom-4 z-10 hidden w-24 overflow-hidden rounded-lg border border-white/10 shadow-xl md:block">
          <div className="relative aspect-[2/3] w-full">
            <Image src={detail.posterUrl} alt={`${detail.title} poster`} fill sizes="96px" className="object-cover" />
          </div>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          {detail.isExclusive ? <Badge variant="accent">Cinevide Exclusive</Badge> : null}
          {detail.availability === "COMING_SOON" ? (
            <Badge variant="outline">Coming soon</Badge>
          ) : detail.availability === "METADATA_ONLY" ? (
            <Badge variant="outline">Catalog Info Only</Badge>
          ) : detail.availability === "REGION_RESTRICTED" ? (
            <Badge variant="outline">Region Restricted</Badge>
          ) : detail.availability === "UNAVAILABLE" ? (
            <Badge variant="outline">Unavailable</Badge>
          ) : null}
          <Badge variant="hdr">{detail.maxResolution}</Badge>
          {detail.audioFormats.includes("Dolby Atmos") ? <Badge variant="outline">Atmos</Badge> : null}
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {detail.title}
          </h2>
          {detail.tagline ? (
            <p className="mt-1 font-display text-sm italic text-muted">{detail.tagline}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1 font-semibold text-gold">
            <Star className="size-4 fill-gold" aria-hidden />
            {formatRating(detail.rating)}
          </span>
          <MetaDot />
          <span className="text-muted">{detail.matchPercent}% Match</span>
          <MetaDot />
          <span className="text-muted">
            {formatCardMeta(detail.type, detail.releaseYear, detail.runtimeMinutes, detail.seasonsCount)}
          </span>
          <MetaDot />
          <span className="border border-white/25 px-1.5 py-px text-xs text-white/80">
            {detail.ageRating}
          </span>
        </div>

        <p className="max-w-2xl text-sm leading-relaxed text-white/85">{detail.synopsis}</p>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            onClick={onPlay}
            disabled={detail.availability !== "AVAILABLE"}
            title={
              detail.availability === "METADATA_ONLY"
                ? "This title is in the catalog for browsing only — no active streaming license."
                : detail.availability === "COMING_SOON"
                ? "Coming soon to Cinevide."
                : undefined
            }
          >
            <Play className="size-5 fill-current" aria-hidden />
            {detail.availability === "AVAILABLE" ? "Play Preview" : "Not Streamable"}
          </Button>
          <Button size="lg" variant="glass" onClick={onToggle} aria-pressed={inList}>
            {inList ? <Check className="size-5 text-gold" aria-hidden /> : <Plus className="size-5" aria-hidden />}
            {inList ? "In My List" : "Add to My List"}
          </Button>
        </div>

        {detail.availability === "METADATA_ONLY" ? (
          <p className="text-xs text-subtle italic">
            Catalog information only. Streaming rights for this title are not licensed.
          </p>
        ) : null}

        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs tracking-wide text-subtle uppercase">Genres</dt>
            <dd className="mt-1 text-white/85">{detail.genres.join(", ")}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-subtle uppercase">Cast</dt>
            <dd className="mt-1 text-white/85">{detail.cast.join(", ")}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-subtle uppercase">Director</dt>
            <dd className="mt-1 text-white/85">{detail.director}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-subtle uppercase">Audio</dt>
            <dd className="mt-1 text-white/85">{detail.audioFormats.join(", ")}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs tracking-wide text-subtle uppercase">Subtitles</dt>
            <dd className="mt-1 text-white/85">{detail.subtitleLanguages.join(", ")}</dd>
          </div>
        </dl>

        {series && season ? (
          <section aria-label="Episodes">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-display text-lg font-semibold text-ink">Episodes</h3>
              <label className="flex items-center gap-2 text-xs text-muted">
                <span>Season</span>
                <select
                  value={selectedSeason}
                  onChange={(event) => setSelectedSeason(Number(event.target.value))}
                  className="cursor-pointer rounded-lg border border-white/15 bg-card px-2.5 py-1.5 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  {series.seasons.map((s, index) => (
                    <option key={s.id} value={index}>
                      S{s.seasonNumber} · {s.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <ul className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10">
              {season.episodes.map((episode) => (
                <li key={episode.id}>
                  <div className="flex items-center gap-3 p-3 transition-colors hover:bg-white/[0.04] sm:gap-4">
                    <span className="w-5 shrink-0 text-center font-display text-sm font-semibold text-subtle">
                      {episode.episodeNumber}
                    </span>
                    <div className="relative hidden aspect-video w-28 shrink-0 overflow-hidden rounded-md sm:block">
                      <Image
                        src={episode.thumbnailUrl}
                        alt=""
                        fill
                        sizes="112px"
                        className="object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="truncate text-sm font-semibold text-ink">{episode.title}</h4>
                        <span className="shrink-0 text-xs text-subtle">
                          {formatRuntime(episode.durationMinutes)}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted">{episode.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={onPlay}
                      aria-label={`Play demo preview of ${episode.title}`}
                      disabled={detail.availability !== "AVAILABLE"}
                      className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-night/60 text-ink transition-colors hover:border-accent hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Play className="size-4 fill-current" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="border-t border-white/5 pt-4 space-y-1">
          {detail.metadataAttribution ? (
            <p className="text-[11px] leading-relaxed text-subtle italic">
              {detail.metadataAttribution}
            </p>
          ) : null}
          <p className="text-[11px] leading-relaxed text-subtle">
            Licensed streaming assets are served via authorized token playback. Demo preview uses CC0 sample footage.
          </p>
        </div>
      </div>
    </div>
  );
}

function MetaDot() {
  return (
    <span aria-hidden className="text-subtle">
      •
    </span>
  );
}
