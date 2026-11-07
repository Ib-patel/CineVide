"use client";

import { useCallback, useState } from "react";
import Image, { type ImageProps } from "next/image";

interface SafeImageProps extends Omit<ImageProps, "onError"> {
  /** Shown on the branded fallback when the image can't load. */
  fallbackTitle?: string;
}

/**
 * next/image that never shows a broken-image icon. If the source 404s or times
 * out, it swaps to a branded title card so a row of posters still looks intentional.
 * Keyed by `src` at the call site's discretion: a new src retries automatically.
 */
/**
 * TMDB already serves each image pre-sized (w300/w780/w1280) from its CDN, so
 * re-optimising through our server adds latency and upstream timeouts for no
 * gain. The browser loads those directly instead.
 */
function isPreSized(src: ImageProps["src"]): boolean {
  return typeof src === "string" && src.startsWith("https://image.tmdb.org/t/p/");
}

/**
 * "Develop" phases for the load-in fade (see `img[data-develop]` in globals.css):
 * - unset: server HTML / priority images — always visible, never hidden by JS.
 * - "pending": hydrated before the bytes arrived — held transparent.
 * - "fade": arrived after hydration — fades up to its normal opacity.
 * - "ready": already decoded at hydration (cache hit) — shown as-is, no flash.
 */
type DevelopPhase = "pending" | "fade" | "ready";

export function SafeImage({
  fallbackTitle,
  className,
  alt,
  src,
  unoptimized,
  onLoad,
  priority,
  ...props
}: SafeImageProps) {
  const [failedSrc, setFailedSrc] = useState<ImageProps["src"] | null>(null);
  const failed = failedSrc !== null && failedSrc === src;
  // Phase is tracked per src so a new image fades in again instead of inheriting "ready".
  const [develop, setDevelop] = useState<{ src: ImageProps["src"]; phase: DevelopPhase } | null>(null);
  const phase = !priority && develop?.src === src ? develop.phase : undefined;

  const attach = useCallback(
    (img: HTMLImageElement | null) => {
      if (!img || priority) return;
      setDevelop((prev) =>
        prev?.src === src ? prev : { src, phase: img.complete && img.naturalWidth > 0 ? "ready" : "pending" }
      );
    },
    [src, priority]
  );

  if (failed) {
    return (
      <div
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className="absolute inset-0 flex items-end overflow-hidden bg-[radial-gradient(120%_80%_at_20%_0%,rgb(242_181_68/0.22),transparent_60%),radial-gradient(100%_70%_at_100%_100%,rgb(245_158_11/0.22),transparent_60%),#121216] p-3"
      >
        {fallbackTitle ? (
          <span className="line-clamp-3 font-display text-base leading-tight font-bold tracking-[-0.02em] text-white/90">
            {fallbackTitle}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <Image
      {...props}
      ref={attach}
      src={src}
      alt={alt}
      priority={priority}
      className={className}
      data-develop={phase}
      unoptimized={unoptimized ?? isPreSized(src)}
      onLoad={(event) => {
        setDevelop((prev) => (prev?.src === src && prev.phase === "pending" ? { src, phase: "fade" } : prev));
        onLoad?.(event);
      }}
      onError={() => setFailedSrc(src)}
    />
  );
}

