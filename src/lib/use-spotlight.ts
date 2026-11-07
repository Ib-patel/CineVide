"use client";

import { useCallback, useRef, type PointerEvent } from "react";

/**
 * Feeds the cursor position to a `card-fx` element as --mx/--my for its glow.
 * Writes straight to the hovered element (no React state, no re-render) and at
 * most once per frame. Mouse only: touch has no hover to follow.
 */
export function useSpotlight<T extends HTMLElement>() {
  const frame = useRef(0);

  return useCallback((event: PointerEvent<T>) => {
    if (event.pointerType !== "mouse") return;
    const el = event.currentTarget;
    const { clientX, clientY } = event;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${clientX - rect.left}px`);
      el.style.setProperty("--my", `${clientY - rect.top}px`);
    });
  }, []);
}
