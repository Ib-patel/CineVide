import type { MediaSummary } from "@/types";

const STORAGE_KEY = "cinevide.watchlist.v2";

export type WatchlistItem = MediaSummary;

interface Listeners {
  on: Set<() => void>;
  items: WatchlistItem[];
  initialized: boolean;
}

const store: Listeners = { on: new Set(), items: [], initialized: false };

const EMPTY: WatchlistItem[] = [];

function readFromStorage(): WatchlistItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter(
      (item): item is WatchlistItem =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as WatchlistItem).id === "string" &&
        typeof (item as WatchlistItem).title === "string"
    );
  } catch {
    return EMPTY;
  }
}

export function ensureWatchlistStore(): void {
  if (!store.initialized) {
    store.items = readFromStorage();
    store.initialized = true;
  }
}

export function getWatchlistItems(): WatchlistItem[] {
  ensureWatchlistStore();
  return store.items;
}

export function replaceWatchlistItems(items: WatchlistItem[]): void {
  ensureWatchlistStore();
  if (store.items === items) return;
  store.items = items;
  persist();
  notify();
}

function persist(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store.items));
  } catch {
    // storage unavailable (private mode); keep in-memory only
  }
}

function notify(): void {
  store.on.forEach((listener) => listener());
}

export function subscribeWatchlist(listener: () => void): () => void {
  ensureWatchlistStore();
  store.on.add(listener);
  return () => {
    store.on.delete(listener);
  };
}

export function toggleInWatchlist(item: WatchlistItem): { items: WatchlistItem[]; added: boolean } {
  const current = getWatchlistItems();
  const exists = current.some((candidate) => candidate.id === item.id);
  const items = exists
    ? current.filter((candidate) => candidate.id !== item.id)
    : [item, ...current];
  replaceWatchlistItems(items);
  return { items, added: !exists };
}
