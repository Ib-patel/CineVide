"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { apiGet, apiSend } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  ensureWatchlistStore,
  getWatchlistItems,
  replaceWatchlistItems,
  subscribeWatchlist,
  toggleInWatchlist,
  type WatchlistItem,
} from "@/context/watchlist-store";

interface WatchlistContextValue {
  hydrated: boolean;
  /** ids currently visible to the UI (server-backed when signed in, local otherwise) */
  watchlistIds: string[];
  watchlistItems: WatchlistItem[];
  isPending: boolean;
  isInWatchlist: (id: string) => boolean;
  /** returns true when the item was added, false when removed */
  toggleWatchlist: (item: WatchlistItem) => boolean;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

const noopSubscribe = () => () => {};
const SERVER_SNAPSHOT_ITEMS: WatchlistItem[] = [];

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const { showToast } = useToast();
  const items = useSyncExternalStore(subscribeWatchlist, getWatchlistItems, () => SERVER_SNAPSHOT_ITEMS);
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [isPending, setIsPending] = useState(false);
  const syncedGuestListRef = useRef(false);
  const lastLoadedUserRef = useRef<string | null>(null);

  // Load the server watchlist whenever the session user changes.
  useEffect(() => {
    if (status !== "ready") return;
    if (user) {
      if (lastLoadedUserRef.current === user.id) return;
      lastLoadedUserRef.current = user.id;
      setIsPending(true);
      apiGet<{ items: WatchlistItem[] }>("/api/watchlist").then((result) => {
        setIsPending(false);
        if (result.ok) {
          replaceWatchlistItems(result.data.items);
        } else {
          showToast("Could not load your watchlist. Showing saved items.");
        }
      });
    } else {
      lastLoadedUserRef.current = null;
      syncedGuestListRef.current = false;
      ensureWatchlistStore();
    }
  }, [user, status, showToast]);

  // One-time migration: merge the guest watchlist into the account after sign-in.
  useEffect(() => {
    if (status !== "ready" || !user || syncedGuestListRef.current) return;
    syncedGuestListRef.current = true;
    ensureWatchlistStore();
    const guestIds = getWatchlistItems().map((item) => item.id);
    if (guestIds.length === 0) return;
    apiSend<{ items: WatchlistItem[] }>("POST", "/api/watchlist/sync", { ids: guestIds }).then(
      (result) => {
        if (result.ok) {
          replaceWatchlistItems(result.data.items);
          showToast("Your saved titles were added to your account.");
        }
        // On failure the server list load (above) remains authoritative.
      }
    );
  }, [user, status, showToast]);

  const isInWatchlist = useCallback(
    (id: string) => items.some((item) => item.id === id),
    [items]
  );

  const toggleWatchlist = useCallback(
    (item: WatchlistItem) => {
      const previous = getWatchlistItems();
      const { added } = toggleInWatchlist(item);
      if (!user) {
        showToast(added ? `Added "${item.title}" to My List` : `Removed "${item.title}" from My List`);
        return added;
      }
      setIsPending(true);
      apiSend<{ created: boolean }>(
        added ? "POST" : "DELETE",
        added ? "/api/watchlist" : `/api/watchlist/${encodeURIComponent(item.id)}`,
        added ? { mediaId: item.id } : undefined
      ).then((result) => {
        setIsPending(false);
        if (result.ok) {
          showToast(added ? `Added "${item.title}" to My List` : `Removed "${item.title}" from My List`);
        } else {
          replaceWatchlistItems(previous);
          showToast(
            result.status === 401
              ? "Sign in to sync your watchlist."
              : `Could not update My List (${result.message})`
          );
        }
      });
      return added;
    },
    [user, showToast]
  );

  const watchlistIds = useMemo(() => items.map((item) => item.id), [items]);

  const value = useMemo(
    () => ({ hydrated, watchlistIds, watchlistItems: items, isPending, isInWatchlist, toggleWatchlist }),
    [hydrated, watchlistIds, items, isPending, isInWatchlist, toggleWatchlist]
  );

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist(): WatchlistContextValue {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error("useWatchlist must be used within WatchlistProvider");
  return ctx;
}
