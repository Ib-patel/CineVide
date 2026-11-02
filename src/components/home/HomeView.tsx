"use client";

import { useState } from "react";
import type { CatalogCategory, ContinueWatchingEntry, MediaDetail, MediaSummary } from "@/types";
import { categories } from "@/data/mock/catalog";
import { filterCatalogByCategory } from "@/lib/catalog-filter";
import { HeroBillboard } from "@/components/hero/HeroBillboard";
import { MediaRow } from "@/components/media/MediaRow";
import { MediaCard } from "@/components/media/MediaCard";
import { RankedMediaCard } from "@/components/media/RankedMediaCard";
import { ContinueWatchingCard } from "@/components/media/ContinueWatchingCard";
import { CategoryFilter } from "@/components/ui/CategoryFilter";
import { useWatchlist } from "@/context/WatchlistContext";

export interface HomeViewProps {
  featured: { media: MediaDetail; previewVideoUrl: string | null }[];
  trending: MediaSummary[];
  popularMovies: MediaSummary[];
  bingeSeries: MediaSummary[];
  exclusives: MediaSummary[];
  topRated: MediaSummary[];
  continueWatching: ContinueWatchingEntry[];
  isDemoContinueWatching?: boolean;
}

export function HomeView({
  featured,
  trending: initialTrending,
  popularMovies: initialPopularMovies,
  bingeSeries: initialBingeSeries,
  exclusives: initialExclusives,
  topRated: initialTopRated,
  continueWatching: initialContinueWatching,
  isDemoContinueWatching,
}: HomeViewProps) {
  const [activeCategory, setActiveCategory] = useState<CatalogCategory>("All");
  const { hydrated, watchlistItems } = useWatchlist();

  const applyFilter = (items: MediaSummary[]) => filterCatalogByCategory(items, activeCategory);

  const trending = applyFilter(initialTrending);
  const popularMovies = applyFilter(initialPopularMovies);
  const bingeSeries = applyFilter(initialBingeSeries);
  const exclusives = applyFilter(initialExclusives);
  const topRated = applyFilter(initialTopRated);
  const continueList = initialContinueWatching.filter((entry) =>
    applyFilter([entry.media]).length > 0
  );

  const showWatchlistRow = hydrated && watchlistItems.length > 0;

  return (
    <div className="w-full overflow-x-clip">
      <HeroBillboard featured={featured} />

      <div className="relative z-30 -mt-8 mb-2 px-4 md:px-10">
        <CategoryFilter
          categories={categories}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
        />
      </div>

      {showWatchlistRow ? (
        <MediaRow title="My List" subtitle={`${watchlistItems.length} titles`}>
          {watchlistItems.map((item, index) => (
            <MediaCard key={item.id} item={item} priority={index < 4} />
          ))}
        </MediaRow>
      ) : null}

      {continueList.length > 0 ? (
        <MediaRow
          title="Continue Watching"
          subtitle={isDemoContinueWatching ? "Demo progress data" : "Your active titles"}
        >
          {continueList.map((entry) => (
            <ContinueWatchingCard
              key={entry.id}
              entry={entry}
              isDemoData={isDemoContinueWatching}
            />
          ))}
        </MediaRow>
      ) : null}

      {trending.length > 0 ? (
        <MediaRow title="Trending Now" subtitle="Top 10 this week">
          {trending.map((item, index) => (
            <RankedMediaCard key={item.id} item={item} rank={index + 1} />
          ))}
        </MediaRow>
      ) : null}

      {popularMovies.length > 0 ? (
        <MediaRow title="Popular Movies">
          {popularMovies.map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </MediaRow>
      ) : null}

      {bingeSeries.length > 0 ? (
        <MediaRow title="Binge-Worthy Series">
          {bingeSeries.map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </MediaRow>
      ) : null}

      {exclusives.length > 0 ? (
        <MediaRow title="Cinevide Exclusives" subtitle="Curated in-house demos">
          {exclusives.map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </MediaRow>
      ) : null}

      {topRated.length > 0 ? (
        <MediaRow title="Top Rated" subtitle="Highest rated in the catalog">
          {topRated.map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </MediaRow>
      ) : null}

      <div className="border-t border-white/5 bg-surface/60 px-4 py-6 md:px-10">
        <p className="mx-auto max-w-6xl text-xs leading-relaxed text-subtle">
          Cinevide demo streaming experience. All titles and metadata are fictional mock data; the
          demo preview uses freely licensed sample footage.
        </p>
      </div>
    </div>
  );
}
