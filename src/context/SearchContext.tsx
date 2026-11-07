"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { MediaSummary } from "@/types";
import { catalogApi } from "@/lib/api-client";

/** Wait this long after the last keystroke before searching. */
export const SEARCH_DEBOUNCE_MS = 350;

export type SearchStatus = "idle" | "loading" | "done" | "error";

interface SearchContextValue {
  /** What is in the input right now. */
  query: string;
  setQuery: (value: string) => void;
  clear: () => void;
  /** The trimmed query the current results belong to. */
  activeQuery: string;
  status: SearchStatus;
  results: MediaSummary[];
  /** True while the user has typed something; the home screen shows results instead of rows. */
  isSearching: boolean;
  retry: () => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [results, setResults] = useState<MediaSummary[]>([]);
  const [attempt, setAttempt] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);

  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length === 0) {
      controllerRef.current?.abort();
      controllerRef.current = null;
      const raf = requestAnimationFrame(() => {
        setActiveQuery("");
        setStatus("idle");
        setResults([]);
      });
      return () => cancelAnimationFrame(raf);
    }

    // Show the loading state immediately; the request itself waits for the debounce.
    const raf = requestAnimationFrame(() => setStatus("loading"));
    const timer = window.setTimeout(async () => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      const items = await catalogApi.search(trimmed, controller.signal, 40);
      // A newer keystroke superseded this request: drop its result silently.
      if (controller.signal.aborted) return;
      setActiveQuery(trimmed);
      if (items === null) {
        setStatus("error");
        setResults([]);
      } else {
        setStatus("done");
        setResults(items);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [trimmed, attempt]);

  // Abort any in-flight request when the provider unmounts.
  useEffect(() => () => controllerRef.current?.abort(), []);

  const value = useMemo<SearchContextValue>(
    () => ({
      query,
      setQuery,
      clear: () => setQuery(""),
      activeQuery,
      status,
      results,
      isSearching: trimmed.length > 0,
      retry: () => setAttempt((n) => n + 1),
    }),
    [query, activeQuery, status, results, trimmed]
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch(): SearchContextValue {
  const context = useContext(SearchContext);
  if (!context) throw new Error("useSearch must be used inside SearchProvider");
  return context;
}
