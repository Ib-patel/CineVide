"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Settings,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import type { ContinueWatchingEntry, MediaSummary, PlaybackSession } from "@/types";
import { useModal, type PlaybackContext } from "@/context/ModalContext";
import { playbackApi, progressApi } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { YouTubeEmbed } from "@/components/player/YouTubeEmbed";
import { OgpbEmbed } from "@/components/player/OgpbEmbed";

interface VideoPlayerProps {
  item: MediaSummary;
  playlist?: ContinueWatchingEntry | null;
  playbackContext?: PlaybackContext | null;
  onClose: () => void;
}

const SAVE_INTERVAL_SECONDS = 5;
const COMPLETION_RATIO = 0.95;

function formatPlayerTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoPlayer({ item, playlist, playbackContext, onClose }: VideoPlayerProps) {
  const { openPlayback } = useModal();

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [session, setSession] = useState<PlaybackSession | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Playback control state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // HLS qualities
  const [qualityLevels, setQualityLevels] = useState<{ id: number; height: number; bitrate: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 = Auto

  // Next episode countdown
  const [countdown, setCountdown] = useState<number | null>(null);
  const [dismissedCountdown, setDismissedCountdown] = useState(false);

  /** Trailers are previews: they never create watch progress. */
  const noProgressRef = useRef(false);
  const lastSavedRef = useRef(0);
  /** Latest known position, kept in a ref so unmount/unload saves don't depend on the (already detached) video element. */
  const lastPositionRef = useRef<{ position: number; duration: number }>({ position: 0, duration: 0 });
  const hideControlsTimerRef = useRef<number | null>(null);

  const targetEpisodeId = playbackContext?.episodeId ?? playlist?.episode?.id ?? null;

  // Real streams only: no sample-clip fallback. Guests are asked to sign in.
  const requestSession = useCallback(
    () => playbackApi.authorize({ mediaId: item.id, episodeId: targetEpisodeId }),
    [item.id, targetEpisodeId]
  );

  // 1. Authorize playback on mount or target change
  useEffect(() => {
    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      setStatus("loading");
      setErrorMessage(null);
      setErrorCode(null);
      setSession(null);
      setCountdown(null);
      setDismissedCountdown(false);
      setQualityLevels([]);
      setCurrentQuality(-1);
    });

    requestSession()
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          setSession(res.data);
          setStatus("ready");
        } else {
          setStatus("error");
          setErrorCode(res.code);
          setErrorMessage(
            res.message || "Playback not authorized. This title may not have an active streaming license."
          );
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Failed to authorize playback.");
      });

    return () => {
      cancelAnimationFrame(raf);
      cancelled = true;
    };
  }, [requestSession]);

  // Save progress helper
  const saveProgress = useCallback(
    (pos: number, dur: number) => {
      if (dur <= 0 || pos < 1 || noProgressRef.current) return;
      const completed = pos / dur >= COMPLETION_RATIO;
      progressApi
        .save({
          mediaId: item.id,
          episodeId: targetEpisodeId,
          positionSeconds: Math.floor(pos),
          durationSeconds: Math.floor(dur),
          completed,
        })
        .catch(() => {});
    },
    [item.id, targetEpisodeId]
  );

  const isYouTube = session?.format === "youtube" && Boolean(session.youtubeId);
  const isOgpb = session?.format === "ogpb";
  const isEmbedded = isYouTube || isOgpb;
  useEffect(() => {
    noProgressRef.current = Boolean(session?.isTrailer);
  }, [session]);

  // 2. Initialize HLS or native MP4 once session is ready (YouTube runs its own player)
  useEffect(() => {
    if (status !== "ready" || !session || isEmbedded) return;
    const video = videoRef.current;
    if (!video) return;

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const startPos = session.startSeconds || 0;
    const isHls = session.format === "hls" || session.playbackUrl.includes(".m3u8");

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 60,
      });
      hlsRef.current = hls;

      hls.loadSource(session.playbackUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const levels = data.levels.map((lvl, index) => ({
          id: index,
          height: lvl.height,
          bitrate: lvl.bitrate,
        }));
        setQualityLevels(levels);

        if (startPos > 5) {
          video.currentTime = startPos;
        }
        video.play().catch(() => {
          // Autoplay policy prevented playback; remains paused for user click
        });
      });

      hls.on(Hls.Events.ERROR, (_, errData) => {
        if (errData.fatal) {
          switch (errData.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setStatus("error");
              setErrorMessage("Video playback failed due to a fatal stream error.");
              break;
          }
        }
      });
    } else {
      // Native MP4 or Safari native HLS
      video.src = session.playbackUrl;
      video.load();
      if (startPos > 5) {
        video.currentTime = startPos;
      }
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [status, session]);

  // 3. Save the final position on close, episode change, or page unload.
  // Uses a keepalive request so it survives navigation, and the position ref
  // because React has already detached videoRef when the cleanup runs.
  useEffect(() => {
    lastPositionRef.current = { position: 0, duration: 0 };
    lastSavedRef.current = 0;

    const flush = () => {
      const { position, duration: dur } = lastPositionRef.current;
      if (position <= 2 || dur <= 0 || noProgressRef.current) return;
      void progressApi.saveKeepalive({
        mediaId: item.id,
        episodeId: targetEpisodeId,
        positionSeconds: Math.floor(position),
        durationSeconds: Math.floor(dur),
        completed: position / dur >= COMPLETION_RATIO,
      });
    };
    const onPageHide = () => flush();
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      flush();
    };
  }, [item.id, targetEpisodeId]);

  // 4. Video event listeners
  const onTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const dur = video.duration || session?.durationSeconds || 0;
    if (video.buffered.length > 0) {
      const buffEnd = video.buffered.end(video.buffered.length - 1);
      setBuffered(dur > 0 ? (buffEnd / dur) * 100 : 0);
    }
    trackPosition(video.currentTime, dur);
  };

  /** Position bookkeeping shared by the native and YouTube players. */
  const trackPosition = (cur: number, dur: number) => {
    setCurrentTime(cur);
    if (Number.isFinite(dur) && dur > 0) {
      lastPositionRef.current = { position: cur, duration: dur };
    }

    // Save progress periodically
    if (Math.abs(cur - lastSavedRef.current) >= SAVE_INTERVAL_SECONDS) {
      lastSavedRef.current = cur;
      saveProgress(cur, dur);
    }

    // Check for next episode countdown (triggers in final 20 seconds of episode)
    if (session?.nextEpisode && !dismissedCountdown && dur > 40 && cur >= dur - 20) {
      const remaining = Math.max(0, Math.ceil(dur - cur));
      setCountdown(remaining);
    } else {
      setCountdown(null);
    }
  };

  const onLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
      if (session?.startSeconds && session.startSeconds > 5 && video.currentTime < 2) {
        video.currentTime = session.startSeconds;
      }
    }
  };

  // 5. Controls timeout
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    hideControlsTimerRef.current = window.setTimeout(() => {
      if (isPlaying && !showSettingsMenu) {
        setShowControls(false);
      }
    }, 3200);
  }, [isPlaying, showSettingsMenu]);

  useEffect(() => {
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    hideControlsTimerRef.current = window.setTimeout(() => {
      if (isPlaying && !showSettingsMenu) {
        setShowControls(false);
      }
    }, 3200);
    return () => {
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    };
  }, [isPlaying, showSettingsMenu]);

  // 6. Action handlers
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
      saveProgress(video.currentTime, video.duration);
    }
    resetControlsTimer();
  };

  const handleSeek = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = Math.max(0, Math.min(seconds, duration || 0));
    video.currentTime = newTime;
    setCurrentTime(newTime);
    saveProgress(newTime, duration);
    resetControlsTimer();
  };

  const handleVolumeChange = (newVol: number) => {
    const video = videoRef.current;
    if (!video) return;
    const v = Math.max(0, Math.min(1, newVol));
    video.volume = v;
    video.muted = v === 0;
    setVolume(v);
    setIsMuted(v === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const willMute = !isMuted;
    video.muted = willMute;
    setIsMuted(willMute);
    if (!willMute && volume === 0) {
      handleVolumeChange(0.5);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (video) video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettingsMenu(false);
  };

  const changeQuality = (lvlId: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = lvlId;
      setCurrentQuality(lvlId);
    }
    setShowSettingsMenu(false);
  };

  const playNextEpisode = () => {
    if (!session?.nextEpisode) return;
    // Save current before jumping
    const video = videoRef.current;
    if (video) saveProgress(video.currentTime, video.duration);

    openPlayback(item, {
      episodeId: session.nextEpisode.id,
      seasonNumber: session.nextEpisode.seasonNumber,
      episodeNumber: session.nextEpisode.episodeNumber,
    });
  };

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      // Space on a focused button already "clicks" it; handling it here too would toggle twice.
      if (e.key === " " && e.target instanceof HTMLButtonElement) return;
      if (isEmbedded) {
        if (e.key === "Escape" && !document.fullscreenElement) onClose();
        return;
      }

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handleSeek(currentTime - 10);
          break;
        case "ArrowRight":
          e.preventDefault();
          handleSeek(currentTime + 10);
          break;
        case "ArrowUp":
          e.preventDefault();
          handleVolumeChange(volume + 0.1);
          break;
        case "ArrowDown":
          e.preventDefault();
          handleVolumeChange(volume - 0.1);
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "Escape":
          if (!document.fullscreenElement) {
            onClose();
          }
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  // Display title label
  const displayTitle = session?.episodeTitle
    ? `${item.title} — S${session.seasonNumber}E${session.episodeNumber}: ${session.episodeTitle}`
    : item.title;

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimer}
      onClick={resetControlsTimer}
      className="relative flex aspect-video w-full flex-col justify-between overflow-hidden bg-black text-ink select-none sm:rounded-2xl"
    >
      {/* YouTube player: official uploads and trailers */}
      {status === "ready" && isYouTube && session?.youtubeId ? (
        <YouTubeEmbed
          videoId={session.youtubeId}
          startSeconds={session.startSeconds ?? 0}
          title={displayTitle}
          onProgress={trackPosition}
          onPlayingChange={setIsPlaying}
          onEnded={() => {
            setIsPlaying(false);
            if (session.nextEpisode) playNextEpisode();
          }}
          onError={(message) => {
            setStatus("error");
            setErrorCode("STREAM_FAILED");
            setErrorMessage(message);
          }}
        />
      ) : null}

      {/* OGPB player: live stream embeds for movies and TV */}
      {status === "ready" && isOgpb && session?.playbackUrl ? (
        <OgpbEmbed
          embedUrl={session.playbackUrl}
          title={displayTitle}
          onError={(message) => {
            setStatus("error");
            setErrorCode("STREAM_FAILED");
            setErrorMessage(message);
          }}
        />
      ) : null}

      {/* Video Element */}
      <video
        hidden={isEmbedded}
        ref={videoRef}
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onEnded={() => {
          setIsPlaying(false);
          if (session?.nextEpisode) playNextEpisode();
        }}
        onClick={togglePlay}
        onError={() => {
          // Native MP4 path (hls.js reports its own errors). Ignore the empty-src state.
          if (status !== "ready" || !session || hlsRef.current) return;
          setStatus("error");
          setErrorCode("STREAM_FAILED");
          setErrorMessage("The stream couldn't be loaded. Check your connection and try again.");
        }}
        className="h-full w-full cursor-pointer object-contain"
      />

      {/* Buffering Indicator */}
      {isBuffering && status === "ready" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="size-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : null}

      {/* Loading State */}
      {status === "loading" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-night/95">
          <div className="size-10 animate-spin rounded-full border-3 border-accent border-t-transparent" />
          <p className="font-display text-sm tracking-wide text-white/80">Authorizing stream session...</p>
        </div>
      ) : null}

      {/* Error State */}
      {status === "error" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-night/95 p-6 text-center">
          <div className="rounded-full bg-accent/20 p-3 text-accent">
            <AlertTriangle className="size-8" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="font-display text-lg font-semibold text-ink">
              {errorCode === "UNAUTHENTICATED" ? "Sign in to start watching" : "Playback Unavailable"}
            </h3>
            <p className="text-sm leading-relaxed text-muted">
              {errorCode === "UNAUTHENTICATED"
                ? "Create a free account or sign in to stream this title and keep your place across devices."
                : errorMessage}
            </p>
          </div>
          {errorCode === "UNAUTHENTICATED" ? (
            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/signin"
                onClick={onClose}
                className="pressable inline-flex h-10 items-center rounded-xl bg-accent px-5 text-sm font-semibold text-night hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                onClick={onClose}
                className="pressable inline-flex h-10 items-center rounded-xl border border-white/30 px-5 text-sm font-semibold text-white hover:border-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Create account
              </Link>
            </div>
          ) : (
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setStatus("loading");
                setErrorMessage(null);
                setErrorCode(null);
                setSession(null);
                requestSession().then((res) => {
                  if (res.ok) {
                    setSession(res.data);
                    setStatus("ready");
                  } else {
                    setStatus("error");
                    setErrorCode(res.code);
                    setErrorMessage(res.message);
                  }
                });
              }}
            >
              Retry Connection
            </Button>
            <Button variant="glass" onClick={onClose}>
              Back to Catalog
            </Button>
          </div>
          )}
        </div>
      ) : null}

      {/* Top Header Bar */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between transition-opacity duration-200 ease-out ${
          isEmbedded
            ? "w-fit p-3"
            : `bg-gradient-to-b from-black/90 via-black/40 to-transparent p-4 ${showControls ? "opacity-100" : "opacity-0"}`
        }`}
      >
        <div className="pointer-events-auto flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Exit player"
            className="pressable inline-flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="size-5" />
          </button>
          {isEmbedded && session?.nextEpisode ? (
            <button
              type="button"
              onClick={playNextEpisode}
              className="pressable inline-flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span>Next Ep</span>
              <SkipForward className="size-3.5" />
            </button>
          ) : null}
          <div className={isEmbedded ? "sr-only" : undefined}>
            <h2 className="font-display text-sm font-semibold tracking-wide text-white drop-shadow sm:text-base">
              {displayTitle}
            </h2>
            {session?.isTrailer ? (
              <span className="inline-block text-[10px] font-medium tracking-wider text-gold uppercase">
                Official trailer
              </span>
            ) : session?.isDemo ? (
              <span className="inline-block text-[10px] font-medium tracking-wider text-gold uppercase">
                Demo Preview Mode
              </span>
            ) : isYouTube && session?.sourceChannel ? (
              <span className="inline-block text-[10px] font-medium tracking-wider text-white/70 uppercase">
                From {session.sourceChannel} on YouTube
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Next Episode Countdown Overlay */}
      {countdown !== null && session?.nextEpisode ? (
        <div className="absolute right-6 bottom-24 z-40 flex items-center gap-4 rounded-xl border border-white/15 bg-night/95 p-4 shadow-2xl backdrop-blur-md">
          <div>
            <p className="text-xs text-subtle uppercase tracking-wider">Up Next in {countdown}s</p>
            <p className="font-display text-sm font-semibold text-white">
              S{session.nextEpisode.seasonNumber}E{session.nextEpisode.episodeNumber}: {session.nextEpisode.title}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={playNextEpisode}>
              <Play className="size-3.5 fill-current" /> Play Now
            </Button>
            <button
              type="button"
              onClick={() => {
                setDismissedCountdown(true);
                setCountdown(null);
              }}
              aria-label="Dismiss next episode countdown"
              className="pressable inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : null}

      {/* Bottom Controls Bar (native streams only; embedded players show their own controls) */}
      <div
        hidden={isEmbedded}
        className={`absolute inset-x-0 bottom-0 z-30 flex flex-col bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 pt-8 transition-opacity duration-200 ease-out ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Scrub Bar */}
        <div
          role="slider"
          tabIndex={0}
          aria-label="Playback seek progress"
          aria-valuemin={0}
          aria-valuemax={duration || 100}
          aria-valuenow={currentTime}
          aria-valuetext={formatPlayerTime(currentTime)}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            handleSeek(ratio * (duration || 0));
          }}
          className="group relative flex h-4 w-full cursor-pointer items-center"
        >
          {/* Background Track */}
          <div className="relative h-1 w-full origin-center rounded-full bg-white/20 transition-[scale] duration-150 ease-out group-hover:scale-y-[1.75]">
            {/* Buffered Progress */}
            <div
              style={{ width: `${buffered}%` }}
              className="absolute inset-y-0 left-0 rounded-full bg-white/30"
            />
            {/* Playhead Progress */}
            <div
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              className="bg-projector absolute inset-y-0 left-0 rounded-full"
            />
          </div>
          {/* Thumb */}
          <div
            style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            className="absolute size-3.5 -translate-x-1/2 scale-0 rounded-full bg-white shadow-[0_0_0_4px_rgb(242_181_68/0.35)] transition-[scale] duration-150 ease-out group-hover:scale-100"
          />
        </div>

        {/* Action Controls Row */}
        <div className="mt-2 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            {/* Play / Pause */}
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="pressable inline-flex size-9 cursor-pointer items-center justify-center rounded-full hover:bg-white/10"
            >
              {isPlaying ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
            </button>

            {/* Jump -10s */}
            <button
              type="button"
              onClick={() => handleSeek(currentTime - 10)}
              aria-label="Seek back 10 seconds"
              className="pressable inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
            >
              <RotateCcw className="size-4" />
            </button>

            {/* Jump +10s */}
            <button
              type="button"
              onClick={() => handleSeek(currentTime + 10)}
              aria-label="Seek forward 10 seconds"
              className="pressable inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
            >
              <RotateCw className="size-4" />
            </button>

            {/* Next Episode Button if available */}
            {session?.nextEpisode ? (
              <button
                type="button"
                onClick={playNextEpisode}
                title={`Next: ${session.nextEpisode.title}`}
                aria-label="Next episode"
                className="pressable inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
              >
                <SkipForward className="size-4 fill-current" />
              </button>
            ) : null}

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute" : "Mute"}
                className="pressable inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
              >
                {isMuted || volume === 0 ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                aria-label="Volume slider"
                className="h-1 w-16 cursor-pointer appearance-none rounded-full bg-white/25 accent-accent sm:w-20"
              />
            </div>

            {/* Time Display */}
            <span className="text-xs text-white/70">
              {formatPlayerTime(currentTime)} / {formatPlayerTime(duration)}
            </span>
          </div>

          <div className="relative flex items-center gap-2">
            {/* Settings Menu Button */}
            <button
              type="button"
              onClick={() => setShowSettingsMenu((prev) => !prev)}
              aria-label="Playback settings"
              className="pressable inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Settings className="size-4" />
            </button>

            {/* Settings Popover */}
            {showSettingsMenu ? (
              <div className="absolute right-0 bottom-10 z-50 w-52 rounded-xl border border-white/15 bg-night/95 p-3 text-xs shadow-2xl backdrop-blur-md">
                <p className="font-semibold text-white/90">Speed</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => changePlaybackRate(rate)}
                      className={`cursor-pointer rounded px-2 py-1 ${
                        playbackRate === rate ? "bg-accent font-semibold text-night" : "hover:bg-white/10"
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>

                {qualityLevels.length > 0 ? (
                  <div className="mt-3 border-t border-white/10 pt-2">
                    <p className="font-semibold text-white/90">Quality</p>
                    <div className="mt-1.5 space-y-1">
                      <button
                        type="button"
                        onClick={() => changeQuality(-1)}
                        className={`flex w-full cursor-pointer items-center justify-between rounded px-2 py-1 ${
                          currentQuality === -1 ? "bg-accent font-semibold text-night" : "hover:bg-white/10"
                        }`}
                      >
                        <span>Auto</span>
                        {currentQuality === -1 ? <Check className="size-3" /> : null}
                      </button>
                      {qualityLevels.map((lvl) => (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => changeQuality(lvl.id)}
                          className={`flex w-full cursor-pointer items-center justify-between rounded px-2 py-1 ${
                            currentQuality === lvl.id ? "bg-accent font-semibold text-night" : "hover:bg-white/10"
                          }`}
                        >
                          <span>{lvl.height}p</span>
                          {currentQuality === lvl.id ? <Check className="size-3" /> : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className="pressable inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
            >
              {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
