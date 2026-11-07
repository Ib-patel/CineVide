"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { useToast } from "@/context/ToastContext";
import {
  ensureWatchlistStore,
  getWatchlistItems,
  subscribeWatchlist,
  toggleInWatchlist,
  type WatchlistItem,
} from "@/context/watchlist-store";

interface WatchlistContextValue {
  hydrated: boolean;
  /** ids in My List, saved in this browser */
  watchlistIds: string[];
  watchlistItems: WatchlistItem[];
  /** Kept for API compatibility: saving is local and instant, so never pending. */
  isPending: boolean;
  isInWatchlist: (id: string) => boolean;
  /** returns true when the item was added, false when removed */
  toggleWatchlist: (item: WatchlistItem) => boolean;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

const noopSubscribe = () => () => {};
const SERVER_SNAPSHOT_ITEMS: WatchlistItem[] = [];

/** My List lives in this browser's storage; Cinevide has no accounts. */
export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const items = useSyncExternalStore(subscribeWatchlist, getWatchlistItems, () => SERVER_SNAPSHOT_ITEMS);
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);

  useEffect(() => {
    ensureWatchlistStore();
  }, []);

  const isInWatchlist = useCallback((id: string) => items.some((item) => item.id === id), [items]);

  const toggleWatchlist = useCallback(
    (item: WatchlistItem) => {
      const { added } = toggleInWatchlist(item);
      showToast(added ? `Added "${item.title}" to My List` : `Removed "${item.title}" from My List`);
      return added;
    },
    [showToast]
  );

  const watchlistIds = useMemo(() => items.map((item) => item.id), [items]);

  const value = useMemo(
    () => ({ hydrated, watchlistIds, watchlistItems: items, isPending: false, isInWatchlist, toggleWatchlist }),
    [hydrated, watchlistIds, items, isInWatchlist, toggleWatchlist]
  );

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist(): WatchlistContextValue {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error("useWatchlist must be used within WatchlistProvider");
  return ctx;
}
