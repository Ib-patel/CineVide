"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { MediaSummary } from "@/types";
import { HoverPreview } from "@/components/media/HoverPreview";

/**
 * Netflix-style hover preview, built to the motion rules:
 * - Intent delay before the first preview, so sweeping the cursor across a row
 *   doesn't fire a storm of popups.
 * - Once a preview is open (or just closed), the next card opens instantly —
 *   like tooltips, subsequent hovers skip the delay.
 * - Only for real mouse pointers; touch and keyboard users keep the in-card actions.
 */
const OPEN_DELAY_MS = 380;
const WARM_WINDOW_MS = 450;
const CLOSE_GRACE_MS = 110;

export interface PreviewAnchor {
  item: MediaSummary;
  rect: DOMRect;
  /** Opened via the warm window: skip the grow animation, just swap. */
  warm: boolean;
}

interface HoverPreviewContextValue {
  /** Call from onPointerEnter of a card. */
  request: (item: MediaSummary, element: HTMLElement, pointerType: string) => void;
  /** Call from onPointerLeave of a card or the preview. */
  release: () => void;
  /** Keep the preview open (pointer entered the preview itself). */
  hold: () => void;
  /** Close immediately (an action was taken). */
  dismiss: () => void;
}

const HoverPreviewContext = createContext<HoverPreviewContextValue | null>(null);

export function HoverPreviewProvider({ children }: { children: ReactNode }) {
  const [anchor, setAnchor] = useState<PreviewAnchor | null>(null);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const lastClosedAt = useRef(0);
  const isOpen = useRef(false);

  const clearTimers = () => {
    if (openTimer.current) window.clearTimeout(openTimer.current);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  };

  const dismiss = useCallback(() => {
    clearTimers();
    if (isOpen.current) lastClosedAt.current = Date.now();
    isOpen.current = false;
    setAnchor(null);
  }, []);

  const request = useCallback((item: MediaSummary, element: HTMLElement, pointerType: string) => {
    if (pointerType !== "mouse") return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    clearTimers();

    const warm = isOpen.current || Date.now() - lastClosedAt.current < WARM_WINDOW_MS;
    const open = () => {
      if (!element.isConnected) return;
      isOpen.current = true;
      setAnchor({ item, rect: element.getBoundingClientRect(), warm });
    };
    if (warm) open();
    else openTimer.current = window.setTimeout(open, OPEN_DELAY_MS);
  }, []);

  const release = useCallback(() => {
    if (openTimer.current) {
      window.clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(dismiss, CLOSE_GRACE_MS);
  }, [dismiss]);

  const hold = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);

  // Anything that moves the anchor (scrolling the page or a row) invalidates the position.
  useEffect(() => {
    if (!anchor) return;
    const onScroll = () => dismiss();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  }, [anchor, dismiss]);

  useEffect(() => () => clearTimers(), []);

  const value = useMemo(() => ({ request, release, hold, dismiss }), [request, release, hold, dismiss]);

  return (
    <HoverPreviewContext.Provider value={value}>
      {children}
      <HoverPreview anchor={anchor} onHold={hold} onRelease={release} onDismiss={dismiss} />
    </HoverPreviewContext.Provider>
  );
}

export function useHoverPreview(): HoverPreviewContextValue {
  const ctx = useContext(HoverPreviewContext);
  if (!ctx) throw new Error("useHoverPreview must be used within HoverPreviewProvider");
  return ctx;
}
