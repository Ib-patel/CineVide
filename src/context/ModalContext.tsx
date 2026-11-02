"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ContinueWatchingEntry, MediaSummary } from "@/types";

export type ModalMode = "details" | "demo";

/** Optional playback context when launching the demo preview from Continue Watching. */
export interface DemoPlaybackContext {
  entry: ContinueWatchingEntry;
}

interface ModalContextValue {
  isOpen: boolean;
  mode: ModalMode;
  selectedItem: MediaSummary | null;
  playbackContext: DemoPlaybackContext | null;
  openDetails: (item: MediaSummary) => void;
  openDemoPreview: (item: MediaSummary, playbackContext?: DemoPlaybackContext) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>("details");
  const [selectedItem, setSelectedItem] = useState<MediaSummary | null>(null);
  const [playbackContext, setPlaybackContext] = useState<DemoPlaybackContext | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const openDetails = useCallback((item: MediaSummary) => {
    triggerRef.current = document.activeElement as HTMLElement | null;
    setSelectedItem(item);
    setMode("details");
    setPlaybackContext(null);
    setIsOpen(true);
  }, []);

  const openDemoPreview = useCallback((item: MediaSummary, context?: DemoPlaybackContext) => {
    triggerRef.current = document.activeElement as HTMLElement | null;
    setSelectedItem(item);
    setMode("demo");
    setPlaybackContext(context ?? null);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
    triggerRef.current = null;
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const value = { isOpen, mode, selectedItem, playbackContext, openDetails, openDemoPreview, closeModal };

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
}
