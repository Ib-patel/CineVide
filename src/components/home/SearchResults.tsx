"use client";

import { useEffect } from "react";
import { SearchX, WifiOff } from "lucide-react";
import type { MediaSummary } from "@/types";
import { useSearch } from "@/context/SearchContext";
import { MediaCard } from "@/components/media/MediaCard";
import { cn } from "@/lib/utils";

const GRID = "grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6";

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

/** Home-screen search results: the rows give way to Movies and Series matching the query. */
export function SearchResults() {
  const { query, activeQuery, status, results, clear, retry } = useSearch();

  // Each new set of results starts at the top of the page.
  useEffect(() => {
    if (activeQuery) window.scrollTo({ top: 0 });
  }, [activeQuery]);

  const movies = results.filter((item) => item.type === "movie");
  const series = results.filter((item) => item.type === "series");
  const typed = query.trim();
  // Results from the previous query stay on screen (dimmed) while the next one loads.
  const stale = status === "loading" && results.length > 0;
  const firstLoad = status === "loading" && results.length === 0;

  let summary = "";
  if (status === "loading") summary = "Searching…";
  else if (status === "done" && results.length > 0)
    summary = `${plural(movies.length, "movie", "movies")} · ${plural(series.length, "series", "series")}`;

  return (
    <section
      aria-label="Search results"
      className="mx-auto min-h-[70vh] w-full max-w-[1920px] px-4 pt-24 pb-16 md:px-10 md:pt-28"
    >
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-[-0.03em] text-balance text-ink md:text-5xl">
          Results for <span className="text-accent">“{typed}”</span>
        </h1>
        <p aria-live="polite" className="mt-2 text-sm text-muted md:text-base">
          {summary}
        </p>
      </header>

      {firstLoad ? <SkeletonGrid /> : null}

      {status === "error" ? (
        <StateMessage
          icon={<WifiOff className="size-6" aria-hidden />}
          title="Search is unavailable right now"
          body="Check your connection and try again."
          action={{ label: "Try again", onClick: retry }}
        />
      ) : null}

      {status === "done" && results.length === 0 ? (
        <StateMessage
          icon={<SearchX className="size-6" aria-hidden />}
          title={`No results for “${activeQuery}”`}
          body="Try a different title, or a genre like “sci-fi” or “heist”."
          action={{ label: "Clear search", onClick: clear }}
        />
      ) : null}

      {results.length > 0 && status !== "error" ? (
        <div
          aria-busy={stale}
          className={cn("space-y-12 transition-opacity duration-200 ease-out", stale && "opacity-50")}
        >
          <ResultGroup title="Movies" items={movies} />
          <ResultGroup title="Series" items={series} />
        </div>
      ) : null}
    </section>
  );
}

function ResultGroup({ title, items }: { title: string; items: MediaSummary[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-label={title}>
      <h2 className="mb-4 flex items-baseline gap-3 font-display text-lg font-semibold tracking-[-0.02em] text-ink md:text-[1.35rem]">
        {title}
        <span className="text-xs font-normal text-subtle">{items.length}</span>
      </h2>
      <ul className={GRID}>
        {items.map((item, index) => (
          <li key={item.id} className="grid-rise" style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}>
            <MediaCard item={item} layout="grid" priority={index < 6} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function SkeletonGrid() {
  return (
    <div aria-hidden className={GRID}>
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-white/[0.06] bg-card">
          <div className="skeleton aspect-[2/3] w-full" />
          <div className="space-y-2 p-3">
            <div className="skeleton h-3.5 w-3/4 rounded-full" />
            <div className="skeleton h-3 w-1/2 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function StateMessage({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.06] bg-surface/60 px-6 py-16 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-white/[0.06] text-white/60">
        {icon}
      </span>
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      <p className="max-w-sm text-sm text-muted">{body}</p>
      <button
        type="button"
        onClick={action.onClick}
        className="pressable mt-1 cursor-pointer rounded-full bg-white px-5 py-2 text-sm font-semibold text-night hover:bg-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        {action.label}
      </button>
    </div>
  );
}
