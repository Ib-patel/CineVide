"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Cinevide mark: a gold "C" ring left open on the right, with the white play
 * triangle breaking out through the opening — cinema → play.
 * Geometry matches src/app/icon.svg (ring r=19, stroke 8, gap ±38°), cropped
 * to the ring's outer edge so it sits flush beside the wordmark.
 */
export function LogoMark({ className }: { className?: string }) {
  // Unique gradient id: the mark renders in several places at once (header,
  // drawer, footer), and duplicate ids break when the first copy is hidden.
  const gradientId = `cv-gold-${useId().replace(/:/g, "")}`;

  return (
    <svg viewBox="8.5 8.5 47 47" className={cn("shrink-0", className)} aria-hidden focusable="false">
      <defs>
        <linearGradient id={gradientId} x1="10" y1="54" x2="54" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#E89A2C" />
          <stop offset=".55" stopColor="#F2B544" />
          <stop offset="1" stopColor="#FFD88A" />
        </linearGradient>
      </defs>
      <path
        d="M46.97 20.30A19 19 0 1 0 46.97 43.70"
        stroke={`url(#${gradientId})`}
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M25 22L25 42L49 32Z"
        fill="#F5F5F7"
        stroke="#F5F5F7"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const SIZES = {
  sm: { mark: "size-6", text: "text-base", gap: "gap-2" },
  md: { mark: "size-7", text: "text-xl", gap: "gap-2.5" },
  lg: { mark: "size-8 md:size-9", text: "text-[1.35rem] md:text-2xl", gap: "gap-2.5" },
} as const;

/** Full lockup: mark + wordmark. The wordmark is real text (Sora), so it stays crisp and selectable-free. */
export function Logo({ size = "md", className }: { size?: keyof typeof SIZES; className?: string }) {
  const s = SIZES[size];
  return (
    <span className={cn("inline-flex items-center select-none", s.gap, className)}>
      <LogoMark className={s.mark} />
      <span
        className={cn(
          "font-display leading-none font-extrabold tracking-[0.06em] text-ink uppercase",
          s.text
        )}
      >
        Cinevide
      </span>
    </span>
  );
}
