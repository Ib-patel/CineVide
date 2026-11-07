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

export type ModalMode = "details" | "playback" | "demo";

/** Optional playback context when launching the video player. */
export interface PlaybackContext {
  entry?: ContinueWatchingEntry;
  episodeId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
}

export type DemoPlaybackContext = PlaybackContext;

interface ModalContextValue {
  isOpen: boolean;
  mode: ModalMode;
  selectedItem: MediaSummary | null;
  playbackContext: PlaybackContext | null;
  openDetails: (item: MediaSummary) => void;
  openPlayback: (item: MediaSummary, playbackContext?: PlaybackContext) => void;
  openDemoPreview: (item: MediaSummary, playbackContext?: PlaybackContext) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>("details");
  const [selectedItem, setSelectedItem] = useState<MediaSummary | null>(null);
  const [playbackContext, setPlaybackContext] = useState<PlaybackContext | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const openDetails = useCallback((item: MediaSummary) => {
    triggerRef.current = document.activeElement as HTMLElement | null;
    setSelectedItem(item);
    setMode("details");
    setPlaybackContext(null);
    setIsOpen(true);
  }, []);

  const openPlayback = useCallback((item: MediaSummary, context?: PlaybackContext) => {
    triggerRef.current = document.activeElement as HTMLElement | null;
    setSelectedItem(item);
    setMode("playback");
    setPlaybackContext(context ?? null);
    setIsOpen(true);
  }, []);

  const openDemoPreview = useCallback((item: MediaSummary, context?: PlaybackContext) => {
    openPlayback(item, context);
  }, [openPlayback]);

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

  const value = {
    isOpen,
    mode,
    selectedItem,
    playbackContext,
    openDetails,
    openPlayback,
    openDemoPreview,
    closeModal,
  };

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
}
