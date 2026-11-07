import {
  getBingeWorthySeries,
  getFeaturedTitles,
  getGenreFacets,
  getGenreRows,
  getLatestReleases,
  getPopularTitles,
  getTopRated,
  getTrendingTitles,
} from "@/server/services/catalog";
import { HomeView } from "@/components/home/HomeView";
import type { MediaSummary } from "@/types";

export const instant = false;

function dedupeAndExclude(items: MediaSummary[], seen: Set<string>, limit: number): MediaSummary[] {
  const result: MediaSummary[] = [];
  for (const item of items) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
      if (result.length >= limit) break;
    }
  }
  return result;
}

export default async function HomePage() {
  const [
    featured,
    rawTrending,
    rawLatestReleases,
    rawBingeSeries,
    rawPopularMovies,
    rawTopRated,
    facets,
  ] = await Promise.all([
    getFeaturedTitles(),
    getTrendingTitles(30),
    getLatestReleases(40),
    getBingeWorthySeries(40),
    getPopularTitles(40),
    getTopRated(40),
    getGenreFacets(),
  ]);

  // Global seen tracker across all home page rows ensures 100% unique titles everywhere
  const seenIds = new Set<string>();

  // 1. Trending ("Top 10 This Week") — exactly ten, ranked 1–10.
  const trending = dedupeAndExclude(rawTrending, seenIds, 10);

  // 2. Latest Releases (now playing movies, strictly excluding trending)
  const latestReleases = dedupeAndExclude(rawLatestReleases, seenIds, 20);

  // 3. Web Series ("Binge-Worthy Series")
  const bingeSeries = dedupeAndExclude(rawBingeSeries, seenIds, 20);

  // 4. Popular Films (popular movies, strictly excluding trending and latest)
  const popularMovies = dedupeAndExclude(rawPopularMovies, seenIds, 20);

  // 5. Genre Rows (Action, Sci-Fi, Crime, Drama, Comedy, Horror, Anime, Thriller)
  // Each genre excludes all prior rows and prior genres!
  const genreRows = await getGenreRows(8, 20, 2, seenIds);

  // 6. Critically Acclaimed (Top Rated, strictly excluding anything seen above)
  const topRated = dedupeAndExclude(rawTopRated, seenIds, 20);

  // Filter chips come from the genres that actually exist in the catalog.
  const genres = facets
    .filter((f) => f.count >= 2)
    .sort((a, b) => b.count - a.count)
    .map((f) => f.genre);

  return (
    <HomeView
      featured={featured}
      trending={trending}
      popularMovies={popularMovies}
      bingeSeries={bingeSeries}
      topRated={topRated}
      genreRows={genreRows}
      latestReleases={latestReleases}
      categories={["All", "Movies", "Series", ...genres]}
      continueWatching={[]}
    />
  );
}
