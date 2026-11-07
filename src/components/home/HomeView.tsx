"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clapperboard } from "lucide-react";
import type { CatalogCategory, ContinueWatchingEntry, MediaDetail, MediaSummary } from "@/types";
import { filterCatalogByCategory } from "@/lib/catalog-filter";
import { HeroBillboard } from "@/components/hero/HeroBillboard";
import { MediaRow } from "@/components/media/MediaRow";
import { MediaCard } from "@/components/media/MediaCard";
import { RankedMediaCard } from "@/components/media/RankedMediaCard";
import { ContinueWatchingCard } from "@/components/media/ContinueWatchingCard";
import { CategoryFilter } from "@/components/ui/CategoryFilter";
import { useWatchlist } from "@/context/WatchlistContext";
import { useSearch } from "@/context/SearchContext";
import { SearchResults } from "@/components/home/SearchResults";
import { continueWatchingApi } from "@/lib/api-client";

export interface HomeViewProps {
  featured: { media: MediaDetail; previewVideoUrl: string | null }[];
  trending: MediaSummary[];
  popularMovies: MediaSummary[];
  bingeSeries: MediaSummary[];
  topRated: MediaSummary[];
  /** Genre rows chosen from the catalog's own data (most-stocked genres first). */
  genreRows: { genre: string; items: MediaSummary[] }[];
  categories: CatalogCategory[];
  continueWatching: ContinueWatchingEntry[];
  /** Optional legacy fields. */
  freeMovies?: MediaSummary[];
  freeSeries?: MediaSummary[];
  /** New in theatres / on streaming services: trailer + where to watch. */
  latestReleases: MediaSummary[];
}

export function HomeView({
  featured,
  trending: initialTrending,
  popularMovies: initialPopularMovies,
  bingeSeries: initialBingeSeries,
  topRated: initialTopRated,
  genreRows: initialGenreRows,
  categories,
  continueWatching: initialContinueWatching,
  freeMovies: initialFreeMovies,
  freeSeries: initialFreeSeries,
  latestReleases: initialLatestReleases,
}: HomeViewProps) {
  const [activeCategory, setActiveCategory] = useState<CatalogCategory>("All");
  const { hydrated, watchlistItems } = useWatchlist();
  const { isSearching } = useSearch();

  // Continue Watching is per-browser, so it loads client-side and the page itself stays static.
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingEntry[]>(initialContinueWatching);
  useEffect(() => {
    const controller = new AbortController();
    continueWatchingApi.list(controller.signal).then((items) => {
      if (!controller.signal.aborted) setContinueWatching(items);
    });
    return () => controller.abort();
  }, []);

  // Starting a search swaps the rows for results; bring the results into view.
  useEffect(() => {
    if (isSearching) window.scrollTo({ top: 0 });
  }, [isSearching]);

  const applyFilter = (items: MediaSummary[]) => filterCatalogByCategory(items, activeCategory);

  const trending = applyFilter(initialTrending);
  const popularMovies = applyFilter(initialPopularMovies);
  const bingeSeries = applyFilter(initialBingeSeries);
  const topRated = applyFilter(initialTopRated);
  const latestReleases = applyFilter(initialLatestReleases);
  // Rows that are a single genre are redundant when that genre is the active filter.
  const genreRows = initialGenreRows
    .filter((row) => row.genre !== activeCategory)
    .map((row) => ({ genre: row.genre, items: applyFilter(row.items) }))
    .filter((row) => row.items.length >= 3);
  const continueList = continueWatching.filter((entry) =>
    applyFilter([entry.media]).length > 0
  );

  const showWatchlistRow = hydrated && watchlistItems.length > 0;
  const nothingMatches =
    activeCategory !== "All" &&
    [trending, popularMovies, bingeSeries, topRated, latestReleases, ...genreRows.map((r) => r.items)].every((list) => list.length === 0) &&
    continueList.length === 0;

  if (isSearching) return <SearchResults />;

  return (
    <div className="w-full overflow-x-clip">
      <HeroBillboard featured={featured} />

      <div className="relative z-30 -mt-10 mb-1 px-4 md:px-10">
        <CategoryFilter
          categories={categories}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
        />
      </div>

      {/* Category switches crossfade the rows rather than snapping them. */}
      <motion.div
        key={activeCategory}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      >
      {nothingMatches ? (
        <div className="mx-4 my-10 flex flex-col items-center gap-3 rounded-2xl border border-white/[0.06] bg-surface/60 px-6 py-14 text-center md:mx-10">
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-white/[0.06] text-white/60">
            <Clapperboard className="size-6" aria-hidden />
          </span>
          <p className="font-display text-lg font-semibold text-ink">Nothing in {activeCategory} yet</p>
          <p className="max-w-sm text-sm text-muted">
            New titles land every week. Try another category, or browse everything.
          </p>
          <button
            type="button"
            onClick={() => setActiveCategory("All")}
            className="pressable mt-1 cursor-pointer rounded-full bg-white px-5 py-2 text-sm font-semibold text-night hover:bg-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Show all titles
          </button>
        </div>
      ) : null}

      {showWatchlistRow ? (
        <MediaRow title="My List" subtitle={`${watchlistItems.length} ${watchlistItems.length === 1 ? "title" : "titles"}`}>
          {watchlistItems.map((item, index) => (
            <MediaCard key={item.id} item={item} priority={index < 4} />
          ))}
        </MediaRow>
      ) : null}

      {continueList.length > 0 ? (
        <MediaRow title="Continue Watching" subtitle="Pick up where you left off">
          {continueList.map((entry) => (
            <ContinueWatchingCard key={entry.id} entry={entry} />
          ))}
        </MediaRow>
      ) : null}

      {trending.length > 0 ? (
        <MediaRow title="Top 10 This Week" subtitle="Most watched in the last 7 days">
          {trending.map((item, index) => (
            <RankedMediaCard key={item.id} item={item} rank={index + 1} />
          ))}
        </MediaRow>
      ) : null}

      {latestReleases.length > 0 ? (
        <MediaRow title="Latest Releases" subtitle="Watch the trailer, then see where it's streaming">
          {latestReleases.map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </MediaRow>
      ) : null}

      {bingeSeries.length > 0 ? (
        <MediaRow title="Binge-Worthy Series" subtitle="Full seasons, ready to stream">
          {bingeSeries.map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </MediaRow>
      ) : null}

      {popularMovies.length > 0 ? (
        <MediaRow title="Popular Films" subtitle="Most watched of all time">
          {popularMovies.map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </MediaRow>
      ) : null}


      {genreRows.map((row) => (
        <MediaRow key={row.genre} title={row.genre} subtitle={`${row.items.length} ${row.items.length === 1 ? "title" : "titles"}`}>
          {row.items.map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </MediaRow>
      ))}

      {topRated.length > 0 ? (
        <MediaRow title="Critically Acclaimed" subtitle="Highest rated on TMDB">
          {topRated.map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </MediaRow>
      ) : null}

      </motion.div>
    </div>
  );
}
