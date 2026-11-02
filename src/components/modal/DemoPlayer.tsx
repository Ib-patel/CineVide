"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Film, ShieldCheck, X } from "lucide-react";
import type { ContinueWatchingEntry, MediaSummary, PlaybackSession } from "@/types";
import { playbackApi, progressApi } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";

interface DemoPlayerProps {
  item: MediaSummary;
  /** Resume context when launched from Continue Watching. */
  playlist?: ContinueWatchingEntry | null;
  onClose: () => void;
}

const DEFAULT_DEMO_VIDEO = "/videos/demo/demo-preview.mp4";
const SAVE_INTERVAL_SECONDS = 5;

export function DemoPlayer({ item, playlist, onClose }: DemoPlayerProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isMetadataOnly = item.availability === "METADATA_ONLY";
  const [status, setStatus] = useState<"loading" | "ready" | "error">(() =>
    isMetadataOnly ? "error" : "loading"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(() =>
    isMetadataOnly
      ? "This title is in the catalog for browsing only. Streaming rights are not licensed."
      : null
  );
  const [playbackSession, setPlaybackSession] = useState<PlaybackSession | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSavedRef = useRef(0);
  const startSecondsRef = useRef(0);
  const pendingSaveRef = useRef(false);

  // Obtain playback authorization token when user is authenticated
  useEffect(() => {
    let cancelled = false;

    if (isMetadataOnly) return;

    if (!user) {
      // Guest playback defaults to demo mode
      const raf = requestAnimationFrame(() => {
        setPlaybackSession({
          mediaId: item.id,
          episodeId: playlist?.episode?.id ?? null,
          playbackUrl: item.demoPreviewUrl || DEFAULT_DEMO_VIDEO,
          token: "guest",
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          format: "mp4",
          isDemo: true,
          provider: "demo",
          allowedRegions: ["GLOBAL"],
        });
      });
      return () => cancelAnimationFrame(raf);
    }

    playbackApi
      .authorize({
        mediaId: item.id,
        episodeId: playlist?.episode?.id ?? null,
      })
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          setPlaybackSession(res.data);
        } else {
          if (res.code === "NOT_STREAMABLE" || res.code === "REGION_RESTRICTED") {
            setStatus("error");
            setErrorMessage(res.message);
          } else {
            // Graceful fallback to demo mode
            setPlaybackSession({
              mediaId: item.id,
              episodeId: playlist?.episode?.id ?? null,
              playbackUrl: item.demoPreviewUrl || DEFAULT_DEMO_VIDEO,
              token: "fallback-demo",
              expiresAt: new Date(Date.now() + 3600000).toISOString(),
              format: "mp4",
              isDemo: true,
              provider: "demo",
              allowedRegions: ["GLOBAL"],
            });
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPlaybackSession({
            mediaId: item.id,
            episodeId: playlist?.episode?.id ?? null,
            playbackUrl: item.demoPreviewUrl || DEFAULT_DEMO_VIDEO,
            token: "fallback-demo",
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
            format: "mp4",
            isDemo: true,
            provider: "demo",
            allowedRegions: ["GLOBAL"],
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, item.id, item.availability, item.demoPreviewUrl, isMetadataOnly, playlist?.episode?.id]);

  // Resume position (authed users with saved progress only)
  useEffect(() => {
    if (!user) return;
    const entry = playlist;
    if (!entry || entry.media.id !== item.id) return;
    startSecondsRef.current = Math.max(0, Math.floor(entry.progressSeconds));
  }, [user, playlist, item.id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || status !== "ready") return;
    if (startSecondsRef.current > 0 && startSecondsRef.current < video.duration) {
      video.currentTime = startSecondsRef.current;
    }
  }, [status]);

  const saveProgress = useCallback(
    (finished: boolean) => {
      const video = videoRef.current;
      if (!video || !user) return;
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      const seconds = finished ? video.duration : Math.floor(video.currentTime);
      pendingSaveRef.current = false;
      lastSavedRef.current = seconds;
      void progressApi.save({
        mediaId: item.id,
        episodeId: playlist?.episode?.id ?? null,
        progressSeconds: seconds,
        durationSeconds: Math.floor(video.duration),
      });
    },
    [user, item.id, playlist?.episode?.id]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || status !== "ready") return;
    if (!user) return;

    const onTimeUpdate = () => {
      const seconds = Math.floor(video.currentTime);
      if (seconds - lastSavedRef.current >= SAVE_INTERVAL_SECONDS) {
        lastSavedRef.current = seconds;
        void progressApi.save({
          mediaId: item.id,
          episodeId: playlist?.episode?.id ?? null,
          progressSeconds: seconds,
          durationSeconds: Math.floor(video.duration),
        });
      }
    };

    const onPause = () => {
      saveProgress(false);
    };

    const onEnded = () => {
      saveProgress(true);
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
    };
  }, [status, user, saveProgress, item.id, playlist?.episode?.id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => {
      pendingSaveRef.current = true;
    };
    video.addEventListener("play", onPlay);
    return () => video.removeEventListener("play", onPlay);
  }, [status]);

  useEffect(() => {
    const video = videoRef.current;
    return () => {
      if (!user || !video) return;
      void progressApi.saveKeepalive({
        mediaId: item.id,
        episodeId: playlist?.episode?.id ?? null,
        progressSeconds: Math.floor(video.currentTime),
        durationSeconds: Math.max(1, Math.floor(video.duration) || 0),
      });
      router.refresh();
    };
  }, [user, item.id, playlist?.episode?.id, router]);

  const streamSrc = playbackSession?.playbackUrl || item.demoPreviewUrl || DEFAULT_DEMO_VIDEO;
  const isAuthorizedStream = playbackSession && !playbackSession.isDemo;

  return (
    <div className="flex h-full flex-col">
      <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-black">
        {status === "loading" && !errorMessage ? (
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
            <Film className="size-8 animate-pulse text-white/40" />
          </div>
        ) : null}
        {status === "error" || errorMessage ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
            <AlertTriangle className="size-8 text-gold" aria-hidden />
            <p className="text-sm font-semibold text-ink">Playback unavailable</p>
            <p className="text-xs text-muted max-w-sm">
              {errorMessage || "The media stream could not be loaded. Please try again later."}
            </p>
          </div>
        ) : (
          <video
            key={`${item.id}-${streamSrc}`}
            ref={videoRef}
            aria-label={`Playback stream for ${item.title}`}
            className="size-full object-cover"
            src={streamSrc}
            poster={item.backdropUrl}
            controls
            autoPlay
            playsInline
            preload="metadata"
            onCanPlay={() => setStatus("ready")}
            onError={() => {
              setStatus("error");
              setErrorMessage("Failed to decode video stream.");
            }}
          />
        )}
        {status === "loading" ? <div className="absolute inset-0" aria-hidden /> : null}
      </div>

      <div className="flex items-start justify-between gap-4 p-4 md:p-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {isAuthorizedStream ? (
              <p className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-emerald-400 uppercase">
                <ShieldCheck className="size-3.5" aria-hidden />
                Authorized Stream
              </p>
            ) : (
              <p className="inline-flex items-center gap-1.5 rounded-md border border-hdr/30 bg-hdr/10 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-hdr uppercase">
                Demo Preview Mode
              </p>
            )}
            <span className="text-[11px] text-subtle font-mono uppercase">
              {playbackSession?.format || "MP4"}
            </span>
          </div>

          <h2 className="mt-2 truncate font-display text-xl font-semibold text-ink md:text-2xl">
            {item.title}
          </h2>
          <p className="mt-1 text-xs text-muted">
            {playlist?.episode
              ? `Resuming S${playlist.episode.seasonNumber}:E${playlist.episode.episodeNumber} — ${playlist.episode.title}. `
              : null}
            {isAuthorizedStream
              ? "Playing authorized media stream with active playback token."
              : "This is a licensed sample preview shown to demonstrate playback capabilities. Full movie licensing is handled via provider rights."}
          </p>
          <p className="mt-1 text-[11px] text-subtle">
            {user
              ? "Playback progress is synchronized with Continue Watching."
              : "Sign in to synchronize playback progress with your account."}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close player"
          className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/5 text-ink transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
