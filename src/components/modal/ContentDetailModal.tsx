"use client";

import { useEffect, useRef, useState } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ExternalLink, Plus, Play, RefreshCw, Star, X } from "lucide-react";
import { IconSwap } from "@/components/ui/IconSwap";
import type { MediaDetail, MediaSummary } from "@/types";
import { canPlay, isSeriesDetail, isTrailerOnly, type WatchProvider } from "@/types";
import { useModal } from "@/context/ModalContext";
import { useToast } from "@/context/ToastContext";
import { useWatchlist } from "@/context/WatchlistContext";
import { catalogApi } from "@/lib/api-client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { VideoPlayer } from "@/components/player/VideoPlayer";
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
          className="fixed inset-0 z-[100] overflow-y-auto bg-night/75 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.24, ease: [0.23, 1, 0.32, 1] } }}
          exit={{ opacity: 0, transition: { duration: 0.18, ease: "easeOut" } }}
          onClick={closeModal}
        >
          <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-6">
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label={
                mode === "playback" || mode === "demo"
                  ? `Playing: ${selectedItem.title}`
                  : `About ${selectedItem.title}`
              }
              data-title={selectedItem.title}
              // Modal stays centred (not origin-aware). Enter on the drawer curve,
              // exit faster than it entered: the user has already decided to leave.
              initial={{ opacity: 0, y: 48, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.34, ease: [0.32, 0.72, 0, 1] } }}
              exit={{ opacity: 0, y: 24, scale: 0.98, transition: { duration: 0.16, ease: "easeOut" } }}
              onClick={(event) => event.stopPropagation()}
              className="relative w-full max-w-3xl overflow-hidden rounded-t-3xl bg-elevated shadow-[0_40px_120px_-30px_rgb(0_0_0/0.95)] ring-1 ring-white/10 sm:rounded-2xl"
            >
              {mode === "playback" || mode === "demo" ? (
                <VideoPlayer
                  key={`playback:${selectedItem.id}`}
                  item={selectedItem}
                  playlist={playbackContext?.entry}
                  playbackContext={playbackContext}
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
  const { openPlayback } = useModal();
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
          className="pressable absolute top-3 right-3 inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-night/70 text-ink backdrop-blur-md hover:bg-night focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
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
      <div role="status" aria-live="polite">
        <span className="sr-only">Loading details…</span>
        <div className="relative aspect-video w-full overflow-hidden sm:aspect-[16/8]">
          {/* The summary art is already cached from the card: show it immediately. */}
          <SafeImage
            src={item.backdropUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-elevated via-elevated/30 to-transparent" />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="pressable absolute top-3 right-3 z-20 inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-night/70 text-ink backdrop-blur-md hover:bg-night focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div className="space-y-4 p-4 sm:p-6">
          <div className="skeleton h-5 w-40 rounded-full" />
          <p className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">{item.title}</p>
          <div className="skeleton h-4 w-64 rounded-full" />
          <div className="space-y-2">
            <div className="skeleton h-3 w-full rounded-full" />
            <div className="skeleton h-3 w-11/12 rounded-full" />
            <div className="skeleton h-3 w-3/4 rounded-full" />
          </div>
          <div className="flex gap-3">
            <div className="skeleton h-12 w-36 rounded-xl" />
            <div className="skeleton h-12 w-40 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <LoadedDetails
      detail={state.detail}
      onClose={onClose}
      closeRef={closeRef}
      onToggle={handleToggle}
      inList={inList}
      onPlay={() => openPlayback(state.detail)}
    />
  );
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
  const { openPlayback } = useModal();
  const series = isSeriesDetail(detail) ? detail : null;
  const [selectedSeason, setSelectedSeason] = useState(0);
  const season = series ? series.seasons[selectedSeason] : null;

  return (
    <div className="max-h-[88vh] overflow-y-auto overscroll-contain">
      <div className="relative aspect-video w-full bg-white/[0.04] sm:aspect-[16/8]">
        <SafeImage
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
          className="pressable absolute top-3 right-3 z-20 inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-night/70 text-ink backdrop-blur-md hover:bg-night focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X className="size-4" aria-hidden />
        </button>

        <div className="absolute right-4 bottom-4 z-10 hidden w-24 overflow-hidden rounded-lg border border-white/10 bg-elevated shadow-xl md:block">
          <div className="relative aspect-[2/3] w-full">
            <SafeImage src={detail.posterUrl} alt={`${detail.title} poster`} fill sizes="96px" className="object-cover" />
          </div>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          {detail.isExclusive ? <Badge variant="accent">Cinevide Original</Badge> : null}
          {isTrailerOnly(detail) ? (
            <Badge variant="outline">New release</Badge>
          ) : detail.availability === "COMING_SOON" ? (
            <Badge variant="outline">Coming soon</Badge>
          ) : detail.availability === "METADATA_ONLY" ? (
            <Badge variant="outline">Catalog Info Only</Badge>
          ) : detail.availability === "REGION_RESTRICTED" ? (
            <Badge variant="outline">Region Restricted</Badge>
          ) : detail.availability === "UNAVAILABLE" ? (
            <Badge variant="outline">Unavailable</Badge>
          ) : null}
          {detail.availability === "AVAILABLE" ? <Badge variant="hdr">{detail.maxResolution}</Badge> : null}
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
          <span className="font-semibold text-emerald-400">{detail.matchPercent}% Match</span>
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
            variant="light"
            onClick={onPlay}
            disabled={!canPlay(detail)}
            title={
              detail.availability === "METADATA_ONLY" && !detail.trailerYoutubeId
                ? "This title is in the catalog for browsing only — no active streaming license."
                : detail.availability === "COMING_SOON"
                ? "Coming soon to Cinevide."
                : undefined
            }
          >
            <Play className="size-5 fill-current" aria-hidden />
            {detail.availability === "AVAILABLE" ? "Watch Now" : isTrailerOnly(detail) ? "Play Trailer" : "Not Streamable"}
          </Button>
          <Button size="lg" variant="glass" onClick={onToggle} aria-pressed={inList}>
            <IconSwap show={inList} on={<Check className="size-5 text-gold" />} off={<Plus className="size-5" />} />
            {inList ? "In My List" : "Add to My List"}
          </Button>
        </div>

        {detail.availability === "AVAILABLE" && detail.sourceChannel ? (
          <p className="text-xs text-subtle">
            Streaming in full from {detail.sourceChannel}&apos;s official YouTube channel.
          </p>
        ) : null}

        {detail.availability !== "AVAILABLE" ? (
          <WhereToWatch providers={detail.watchProviders} link={detail.watchLink} title={detail.title} />
        ) : null}

        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs tracking-wide text-subtle uppercase">Genres</dt>
            <dd className="mt-1 text-white/85">{detail.genres.join(", ")}</dd>
          </div>
          {detail.cast.length > 0 ? (
            <div>
              <dt className="text-xs tracking-wide text-subtle uppercase">Cast</dt>
              <dd className="mt-1 text-white/85">{detail.cast.join(", ")}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs tracking-wide text-subtle uppercase">Director</dt>
            <dd className="mt-1 text-white/85">{detail.director}</dd>
          </div>
          {detail.audioFormats.length > 0 ? (
            <div>
              <dt className="text-xs tracking-wide text-subtle uppercase">Audio</dt>
              <dd className="mt-1 text-white/85">{detail.audioFormats.join(", ")}</dd>
            </div>
          ) : null}
          {detail.subtitleLanguages.length > 0 ? (
            <div className="sm:col-span-2">
              <dt className="text-xs tracking-wide text-subtle uppercase">Subtitles</dt>
              <dd className="mt-1 text-white/85">{detail.subtitleLanguages.join(", ")}</dd>
            </div>
          ) : null}
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

            <motion.ul
              key={season.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10"
            >
              {season.episodes.map((episode) => (
                <li key={episode.id}>
                  <div className="flex items-center gap-3 p-3 transition-colors hover:bg-white/[0.04] sm:gap-4">
                    <span className="w-5 shrink-0 text-center font-display text-sm font-semibold text-subtle">
                      {episode.episodeNumber}
                    </span>
                    <div className="relative hidden aspect-video w-28 shrink-0 overflow-hidden rounded-md sm:block">
                      <SafeImage
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
                      onClick={() =>
                        openPlayback(detail, {
                          episodeId: episode.id,
                          seasonNumber: season.seasonNumber,
                          episodeNumber: episode.episodeNumber,
                        })
                      }
                      aria-label={`Play ${episode.title}`}
                      disabled={detail.availability !== "AVAILABLE"}
                      className="pressable inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-night/60 text-ink hover:border-white hover:bg-white hover:text-night focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Play className="size-4 fill-current" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </motion.ul>
          </section>
        ) : null}

        <div className="border-t border-white/5 pt-4 space-y-1">
          {detail.metadataAttribution ? (
            <p className="text-[11px] leading-relaxed text-subtle italic">
              {detail.metadataAttribution}
            </p>
          ) : null}

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

const PROVIDER_KIND_LABEL: Record<WatchProvider["kind"], string> = {
  free: "Free",
  ads: "Free with ads",
  flatrate: "Subscription",
  rent: "Rent",
  buy: "Buy",
};

/** Legal services carrying a title we can't stream in full (data: TMDB / JustWatch). */
function WhereToWatch({ providers, link, title }: { providers: WatchProvider[]; link: string | null; title: string }) {
  if (providers.length === 0) {
    return (
      <p className="text-sm text-muted">
        Not on a streaming service in your region yet. New films usually reach one a few weeks after
        their theatrical run.
      </p>
    );
  }
  return (
    <section aria-label={`Where to watch ${title}`} className="space-y-2.5">
      <h3 className="text-xs tracking-wide text-subtle uppercase">Where to watch</h3>
      <ul className="flex flex-wrap gap-2">
        {providers.map((p) => {
          const body = (
            <>
              <span className="relative size-8 shrink-0 overflow-hidden rounded-lg">
                <SafeImage src={p.logoUrl} alt="" fill sizes="32px" className="object-cover" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">{p.name}</span>
                <span className="block text-[11px] text-subtle">{PROVIDER_KIND_LABEL[p.kind]}</span>
              </span>
            </>
          );
          return (
            <li key={p.name}>
              {link ? (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pressable flex max-w-[15rem] items-center gap-2.5 rounded-xl border border-white/10 bg-card py-1.5 pr-3 pl-1.5 hover:border-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  {body}
                </a>
              ) : (
                <div className="flex max-w-[15rem] items-center gap-2.5 rounded-xl border border-white/10 bg-card py-1.5 pr-3 pl-1.5">
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted underline-offset-2 hover:text-ink hover:underline"
        >
          All viewing options <ExternalLink className="size-3" aria-hidden />
        </a>
      ) : null}
      <p className="text-[11px] text-subtle">Streaming availability data from JustWatch via TMDB.</p>
    </section>
  );
}
