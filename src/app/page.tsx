import {
  getBingeWorthySeries,
  getExclusives,
  getFeaturedTitles,
  getPopularTitles,
  getTopRated,
  getTrendingTitles,
} from "@/server/services/catalog";
import { getContinueWatching } from "@/server/services/progress";
import { getCurrentSessionUser } from "@/server/auth/session";
import { HomeView } from "@/components/home/HomeView";
import { continueWatching as mockContinueWatching } from "@/data/mock/catalog";
import type { ContinueWatchingEntry } from "@/types";

export default async function HomePage() {
  const [user, featured, trending, popularMovies, bingeSeries, exclusives, topRated] =
    await Promise.all([
      getCurrentSessionUser().catch(() => null),
      getFeaturedTitles(),
      getTrendingTitles(10),
      getPopularTitles(12),
      getBingeWorthySeries(10),
      getExclusives(10),
      getTopRated(12),
    ]);

  let continueWatching: ContinueWatchingEntry[] = [];
  let isDemoContinueWatching = false;

  if (user) {
    continueWatching = await getContinueWatching(user.id);
  }

  if (continueWatching.length === 0) {
    isDemoContinueWatching = true;
    const allSummaries = [
      ...trending,
      ...popularMovies,
      ...bingeSeries,
      ...exclusives,
      ...topRated,
    ];
    continueWatching = mockContinueWatching
      .map((entry) => {
        const media = allSummaries.find(
          (m) => m.slug === entry.mediaId || m.id === entry.mediaId
        );
        if (!media) return null;
        return {
          id: entry.id,
          media,
          episode: entry.episode
            ? {
                id: `demo-${entry.id}`,
                seasonNumber: entry.episode.seasonNumber,
                episodeNumber: entry.episode.episodeNumber,
                title: entry.episode.title,
              }
            : null,
          progressSeconds: entry.progressSeconds,
          durationSeconds: entry.durationSeconds,
          updatedAt: new Date().toISOString(),
        };
      })
      .filter((entry): entry is ContinueWatchingEntry => entry !== null);
  }

  return (
    <HomeView
      featured={featured}
      trending={trending}
      popularMovies={popularMovies}
      bingeSeries={bingeSeries}
      exclusives={exclusives}
      topRated={topRated}
      continueWatching={continueWatching}
      isDemoContinueWatching={isDemoContinueWatching}
    />
  );
}

