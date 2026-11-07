"use client";

import { useEffect, useRef } from "react";

/**
 * YouTube's official embedded player (privacy-enhanced youtube-nocookie host),
 * driven through the IFrame Player API so Cinevide can resume, save progress
 * and auto-advance episodes. YouTube's own controls stay visible, as its terms
 * require; nothing is overlaid on the video.
 */

interface YTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  destroy(): void;
}

interface YTNamespace {
  Player: new (
    el: HTMLElement,
    options: {
      host?: string;
      videoId: string;
      width?: string;
      height?: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (e: { target: YTPlayer }) => void;
        onStateChange?: (e: { data: number; target: YTPlayer }) => void;
        onError?: (e: { data: number }) => void;
      };
    }
  ) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      reject(new Error("YouTube player failed to load"));
    };
    document.head.appendChild(script);
  });
  return apiPromise;
}

/** YouTube player error codes → what the viewer should hear. */
function describeError(code: number): string {
  if (code === 101 || code === 150 || code === 153) return "The rights holder doesn't allow this video to play outside YouTube right now.";
  if (code === 100) return "This video was removed by its uploader.";
  if (code === 5) return "Your browser couldn't play this video.";
  return "The video couldn't be loaded. Check your connection and try again.";
}

const STATE_ENDED = 0;
const STATE_PLAYING = 1;

export function YouTubeEmbed({
  videoId,
  startSeconds,
  title,
  onProgress,
  onPlayingChange,
  onEnded,
  onError,
}: {
  videoId: string;
  startSeconds: number;
  title: string;
  onProgress: (position: number, duration: number) => void;
  onPlayingChange: (playing: boolean) => void;
  onEnded: () => void;
  onError: (message: string) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  // Latest callbacks without re-creating the player on every render.
  const handlers = useRef({ onProgress, onPlayingChange, onEnded, onError });
  useEffect(() => {
    handlers.current = { onProgress, onPlayingChange, onEnded, onError };
  });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let player: YTPlayer | null = null;
    let poll: number | null = null;
    let disposed = false;
    // The API replaces the target element with its iframe, so give it a child of its own.
    const target = document.createElement("div");
    mount.appendChild(target);

    loadYouTubeApi()
      .then((YT) => {
        if (disposed) return;
        player = new YT.Player(target, {
          host: "https://www.youtube-nocookie.com",
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 1,
            playsinline: 1,
            rel: 0,
            start: Math.floor(startSeconds > 5 ? startSeconds : 0),
            origin: window.location.origin,
          },
          events: {
            onReady: (e) => {
              const frame = mount.querySelector("iframe");
              frame?.setAttribute("title", title);
              frame?.setAttribute("allow", "autoplay; encrypted-media; fullscreen; picture-in-picture");
              poll = window.setInterval(() => {
                const duration = e.target.getDuration();
                if (duration > 0) handlers.current.onProgress(e.target.getCurrentTime(), duration);
              }, 1000);
            },
            onStateChange: (e) => {
              handlers.current.onPlayingChange(e.data === STATE_PLAYING);
              if (e.data === STATE_ENDED) handlers.current.onEnded();
            },
            onError: (e) => handlers.current.onError(describeError(e.data)),
          },
        });
      })
      .catch((err: unknown) => {
        if (!disposed) handlers.current.onError(err instanceof Error ? err.message : "YouTube player failed to load");
      });

    return () => {
      disposed = true;
      if (poll) clearInterval(poll);
      player?.destroy();
      mount.replaceChildren();
    };
  }, [videoId, startSeconds, title]);

  return <div ref={mountRef} className="absolute inset-0 [&_iframe]:h-full [&_iframe]:w-full" />;
}
