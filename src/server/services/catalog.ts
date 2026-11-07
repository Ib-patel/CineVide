import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Availability, Genre, MediaDetail, MediaSummary, MediaType, Season, Episode } from "@/types";

const BASE = "https://theogpiratebot.online";
const IMG = "https://image.tmdb.org/t/p";

const GENRE_MAP: Record<number, Genre[]> = {
  28: ["Action"],
  12: ["Adventure"],
  16: ["Anime"],
  35: ["Comedy"],
  80: ["Crime"],
  99: ["Documentary"],
  18: ["Drama"],
  10751: ["Family"],
  14: ["Fantasy"],
  36: ["History"],
  27: ["Horror"],
  10402: ["Music"],
  9648: ["Mystery"],
  10749: ["Romance"],
  878: ["Sci-Fi"],
  53: ["Thriller"],
  10752: ["War"],
  37: ["Western"],
  10759: ["Action", "Adventure"],
  10762: ["Family"],
  10765: ["Sci-Fi", "Fantasy"],
  10768: ["War"],
};

export const BROWSABLE_AVAILABILITY: Availability[] = ["AVAILABLE", "METADATA_ONLY"];

function mapGenres(ids: number[] = []): Genre[] {
  const g = Array.from(new Set(ids.flatMap((id) => GENRE_MAP[id] ?? [])));
  return g.length > 0 ? g : ["Drama"];
}

function slugify(title: string, id: number): string {
  const base = (title || `title-${id}`)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base}-${id}`;
}

export function extractIdFromSlug(slug: string): { id: number | null; typeHint?: MediaType } {
  const m = slug.match(/(\d+)$/);
  if (m) return { id: Number(m[1]) };
  const num = Number(slug);
  return { id: !Number.isNaN(num) && num > 0 ? num : null };
}

interface RawTmdbItem {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  popularity?: number;
  media_type?: string;
}

function toSummary(item: RawTmdbItem, explicitType?: MediaType): MediaSummary {
  const isTv = explicitType === "series" || item.media_type === "tv" || Boolean(item.name && !item.title);
  const title = (isTv ? item.name : item.title) || item.original_title || "Untitled";
  const dateStr = (isTv ? item.first_air_date : item.release_date) || "";
  const year = dateStr && /^\d{4}/.test(dateStr) ? Number(dateStr.slice(0, 4)) : 2026;
  const rating = Number((item.vote_average ?? 7.0).toFixed(1));
  const genreIds = item.genre_ids ?? item.genres?.map((g) => g.id) ?? [];
  const posterUrl = item.poster_path ? `${IMG}/w780${item.poster_path}` : "/images/branding/logo-mark.svg";
  const backdropUrl = item.backdrop_path ? `${IMG}/w1280${item.backdrop_path}` : posterUrl;

  return {
    id: String(item.id),
    slug: slugify(title, item.id),
    title,
    tagline: null,
    type: isTv ? "series" : "movie",
    genres: mapGenres(genreIds),
    posterUrl,
    backdropUrl,
    rating,
    releaseYear: year,
    runtimeMinutes: isTv ? 45 : 120,
    seasonsCount: isTv ? 1 : null,
    ageRating: "U/A 13+",
    matchPercent: Math.min(99, Math.max(60, Math.round(rating * 10 + 5))),
    maxResolution: "Full HD",
    isExclusive: false,
    availability: "AVAILABLE",
    demoPreviewUrl: "",
    externalSource: "proxy",
    metadataAttribution: null,
  };
}

/** Every catalog cache entry carries this tag, so `revalidateTag(CATALOG_CACHE_TAG)` refreshes them all. */
export const CATALOG_CACHE_TAG = "catalog";

/** Title details and season listings barely change; lists (trending, discover, search) move daily. */
function isDetailPath(path: string): boolean {
  return /^\/tmdb\/(movie|tv)\/\d+/.test(path);
}

/**
 * Cached upstream read. One entry per path, shared by every page, route and request.
 *
 * Failures throw instead of returning null: Next.js does not store a cache entry
 * whose function threw, so an upstream outage is retried on the next request
 * rather than being cached as an empty catalog for hours.
 */
async function fetchProxyCached(path: string): Promise<unknown> {
  "use cache";
  if (isDetailPath(path)) {
    cacheLife("days");
  } else {
    cacheLife("hours");
  }
  cacheTag(CATALOG_CACHE_TAG, `tmdb:${path.split("?")[0]}`);

  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "User-Agent": "CineVide/1.0" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`Failed to fetch proxy ${path}:`, err);
    return null;
  }
}

async function fetchProxy<T>(path: string): Promise<T | null> {
  try {
    return (await fetchProxyCached(path)) as T;
  } catch (err) {
    console.error(`Failed to fetch proxy ${path}:`, err);
    return null;
  }
}

export function dedupeMedia<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
}

export interface CatalogQueryParams {
  type?: "movie" | "series";
  genre?: string;
  q?: string;
  sort?: "rating" | "year" | "popularity";
  cursor?: number;
  limit?: number;
  availability?: Availability | Availability[];
}

export interface CatalogListResult {
  data: MediaSummary[];
  nextCursor: number | null;
  total: number;
}

export async function listCatalog(params: CatalogQueryParams): Promise<CatalogListResult> {
  const limit = params.limit ?? 24;
  const page = Math.floor((params.cursor ?? 0) / limit) + 1;

  if (params.q) {
    const searchRes = await fetchProxy<{ results?: RawTmdbItem[]; total_results?: number }>(
      `/tmdb/search/multi?query=${encodeURIComponent(params.q)}&include_adult=false&page=${page}`
    );
    const rawItems = (searchRes?.results ?? []).filter((r) => r.poster_path).map((r) => toSummary(r));
    const items = dedupeMedia(rawItems);
    return { data: items.slice(0, limit), nextCursor: items.length >= limit ? (params.cursor ?? 0) + limit : null, total: searchRes?.total_results ?? items.length };
  }

  const endpoint =
    params.type === "series"
      ? `/tmdb/discover/tv?include_adult=false&sort_by=popularity.desc&page=${page}`
      : `/tmdb/discover/movie?include_adult=false&sort_by=popularity.desc&page=${page}`;

  const res = await fetchProxy<{ results?: RawTmdbItem[]; total_results?: number }>(endpoint);
  const rawItems = (res?.results ?? []).filter((r) => r.poster_path).map((r) => toSummary(r, params.type));
  const items = dedupeMedia(rawItems);
  return {
    data: items.slice(0, limit),
    nextCursor: items.length >= limit ? (params.cursor ?? 0) + limit : null,
    total: res?.total_results ?? 1000,
  };
}

export async function listMovies(limit = 120): Promise<MediaSummary[]> {
  const pages = Math.ceil(limit / 20);
  const promises = Array.from({ length: Math.min(pages, 6) }, (_, i) =>
    fetchProxy<{ results?: RawTmdbItem[] }>(`/tmdb/discover/movie?include_adult=false&sort_by=popularity.desc&page=${i + 1}`)
  );
  const results = await Promise.all(promises);
  const raw = results.flatMap((r) => (r?.results ?? []).filter((item) => item.poster_path).map((item) => toSummary(item, "movie")));
  return dedupeMedia(raw).slice(0, limit);
}

export async function listSeries(limit = 120): Promise<MediaSummary[]> {
  const pages = Math.ceil(limit / 20);
  const promises = Array.from({ length: Math.min(pages, 6) }, (_, i) =>
    fetchProxy<{ results?: RawTmdbItem[] }>(`/tmdb/discover/tv?include_adult=false&sort_by=popularity.desc&page=${i + 1}`)
  );
  const results = await Promise.all(promises);
  const raw = results.flatMap((r) => (r?.results ?? []).filter((item) => item.poster_path).map((item) => toSummary(item, "series")));
  return dedupeMedia(raw).slice(0, limit);
}

export async function searchCatalog(query: string, limit = 12): Promise<MediaSummary[]> {
  const res = await fetchProxy<{ results?: RawTmdbItem[] }>(
    `/tmdb/search/multi?query=${encodeURIComponent(query)}&include_adult=false&page=1`
  );
  const raw = (res?.results ?? []).filter((r) => r.poster_path).map((r) => toSummary(r));
  return dedupeMedia(raw).slice(0, limit);
}

export async function getTrendingTitles(limit = 30): Promise<MediaSummary[]> {
  const [res1, res2] = await Promise.all([
    fetchProxy<{ results?: RawTmdbItem[] }>("/tmdb/trending/all/week?include_adult=false&page=1"),
    fetchProxy<{ results?: RawTmdbItem[] }>("/tmdb/trending/all/week?include_adult=false&page=2"),
  ]);
  const all = [...(res1?.results ?? []), ...(res2?.results ?? [])];
  const items = all.filter((r) => r.poster_path).map((r) => toSummary(r));
  return dedupeMedia(items).slice(0, limit);
}

export async function getPopularTitles(limit = 40): Promise<MediaSummary[]> {
  const [res1, res2] = await Promise.all([
    fetchProxy<{ results?: RawTmdbItem[] }>("/tmdb/movie/top_rated?include_adult=false&page=1"),
    fetchProxy<{ results?: RawTmdbItem[] }>("/tmdb/movie/top_rated?include_adult=false&page=2"),
  ]);
  const all = [...(res1?.results ?? []), ...(res2?.results ?? [])];
  const items = all.filter((r) => r.poster_path).map((r) => toSummary(r, "movie"));
  return dedupeMedia(items).slice(0, limit);
}

export async function getBingeWorthySeries(limit = 40): Promise<MediaSummary[]> {
  const [res1, res2] = await Promise.all([
    fetchProxy<{ results?: RawTmdbItem[] }>("/tmdb/tv/top_rated?include_adult=false&page=1"),
    fetchProxy<{ results?: RawTmdbItem[] }>("/tmdb/tv/top_rated?include_adult=false&page=2"),
  ]);
  const all = [...(res1?.results ?? []), ...(res2?.results ?? [])];
  const items = all.filter((r) => r.poster_path).map((r) => toSummary(r, "series"));
  return dedupeMedia(items).slice(0, limit);
}

export async function getExclusives(limit = 10): Promise<MediaSummary[]> {
  return getTrendingTitles(limit);
}

export async function getTopRated(limit = 40): Promise<MediaSummary[]> {
  const [res1, res2] = await Promise.all([
    fetchProxy<{ results?: RawTmdbItem[] }>("/tmdb/discover/movie?sort_by=vote_average.desc&vote_count.gte=300&page=1"),
    fetchProxy<{ results?: RawTmdbItem[] }>("/tmdb/discover/movie?sort_by=vote_average.desc&vote_count.gte=300&page=2"),
  ]);
  const all = [...(res1?.results ?? []), ...(res2?.results ?? [])];
  const items = all.filter((r) => r.poster_path).map((r) => toSummary(r, "movie"));
  return dedupeMedia(items).slice(0, limit);
}

export interface FeaturedWithPreview {
  media: MediaDetail;
  previewVideoUrl: string | null;
}

export async function getFeaturedTitles(): Promise<FeaturedWithPreview[]> {
  const trending = await getTrendingTitles(5);
  const details = await Promise.all(trending.map((t) => getMediaById(t.id)));
  return details.filter((d): d is MediaDetail => d !== null).map((media) => ({
    media,
    previewVideoUrl: null,
  }));
}

export async function getGenreFacets(): Promise<{ genre: string; count: number }[]> {
  return [
    { genre: "Action", count: 50 },
    { genre: "Drama", count: 45 },
    { genre: "Sci-Fi", count: 35 },
    { genre: "Crime", count: 30 },
    { genre: "Comedy", count: 28 },
    { genre: "Horror", count: 25 },
    { genre: "Anime", count: 22 },
    { genre: "Thriller", count: 20 },
  ];
}

const GENRE_ID_MAP: Record<string, number> = {
  Action: 28,
  Adventure: 12,
  Anime: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Fantasy: 14,
  History: 36,
  Horror: 27,
  Music: 10402,
  Mystery: 9648,
  Romance: 10749,
  "Sci-Fi": 878,
  Thriller: 53,
  War: 10752,
  Western: 37,
};

export async function getGenreRows(
  maxRows = 8,
  perRow = 24,
  _minTitles = 1,
  excludeIds?: Set<string>
): Promise<{ genre: string; items: MediaSummary[] }[]> {
  const genres = ["Action", "Sci-Fi", "Crime", "Drama", "Comedy", "Horror", "Anime", "Thriller"].slice(0, maxRows);

  const genreData = await Promise.all(
    genres.map(async (genre) => {
      const genreId = GENRE_ID_MAP[genre] || 28;
      const [res1, res2] = await Promise.all([
        fetchProxy<{ results?: RawTmdbItem[] }>(
          `/tmdb/discover/movie?include_adult=false&with_genres=${genreId}&sort_by=popularity.desc&page=1`
        ),
        fetchProxy<{ results?: RawTmdbItem[] }>(
          `/tmdb/discover/movie?include_adult=false&with_genres=${genreId}&sort_by=popularity.desc&page=2`
        ),
      ]);
      const all = [...(res1?.results ?? []), ...(res2?.results ?? [])];
      const items = all.filter((r) => r.poster_path).map((r) => toSummary(r, "movie"));
      return { genre, items };
    })
  );

  const seen = new Set<string>(excludeIds ?? []);
  const rows: { genre: string; items: MediaSummary[] }[] = [];

  for (const { genre, items } of genreData) {
    const uniqueItems: MediaSummary[] = [];
    for (const item of items) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        uniqueItems.push(item);
        if (uniqueItems.length >= perRow) break;
      }
    }
    if (uniqueItems.length >= _minTitles) {
      rows.push({ genre, items: uniqueItems });
    }
  }

  return rows;
}

export async function getRecentlyAdded(limit = 12): Promise<(MediaSummary & { addedAt: string })[]> {
  // Cached so the timestamp is fixed per entry (a bare `new Date()` blocks prerendering).
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_CACHE_TAG);
  const items = await getTrendingTitles(limit);
  return items.map((i) => ({ ...i, addedAt: new Date().toISOString() }));
}

export async function getLatestReleases(limit = 40): Promise<MediaSummary[]> {
  const [res1, res2] = await Promise.all([
    fetchProxy<{ results?: RawTmdbItem[] }>("/tmdb/movie/now_playing?include_adult=false&page=1"),
    fetchProxy<{ results?: RawTmdbItem[] }>("/tmdb/movie/now_playing?include_adult=false&page=2"),
  ]);
  const all = [...(res1?.results ?? []), ...(res2?.results ?? [])];
  const items = all.filter((r) => r.poster_path).map((r) => toSummary(r, "movie"));
  return dedupeMedia(items).slice(0, limit);
}

export async function getYouTubeTitles(type: "movie" | "series", limit = 24): Promise<MediaSummary[]> {
  return type === "movie" ? getLatestReleases(limit) : getBingeWorthySeries(limit);
}

interface RawDetailResponse extends RawTmdbItem {
  tagline?: string;
  runtime?: number;
  episode_run_time?: number[];
  number_of_seasons?: number;
  credits?: { cast?: { name: string }[]; crew?: { name: string; job: string }[] };
  aggregate_credits?: { cast?: { name: string }[] };
}

export async function getMediaById(idStr: string): Promise<MediaDetail | null> {
  const { id } = extractIdFromSlug(idStr);
  if (!id) return null;

  // Try movie first, then TV
  let raw = await fetchProxy<RawDetailResponse>(`/tmdb/movie/${id}?append_to_response=credits`);
  let isTv = false;

  if (!raw || !raw.title) {
    raw = await fetchProxy<RawDetailResponse>(`/tmdb/tv/${id}?append_to_response=aggregate_credits`);
    isTv = true;
  }

  if (!raw) return null;

  const summary = toSummary(raw, isTv ? "series" : "movie");
  const cast = (isTv ? raw.aggregate_credits?.cast : raw.credits?.cast)?.slice(0, 6).map((c) => c.name) ?? [];
  const director = isTv ? "Various" : raw.credits?.crew?.find((c) => c.job === "Director")?.name ?? "Director";

  if (isTv) {
    // Fetch season 1 episodes
    const seasonData = await fetchProxy<{
      episodes?: { id: number; episode_number: number; name: string; overview: string; still_path: string | null }[];
    }>(`/tmdb/tv/${id}/season/1`);

    const episodes: Episode[] = (seasonData?.episodes ?? [
      { id: 1, episode_number: 1, name: "Episode 1", overview: summary.title, still_path: null },
    ]).map((ep) => ({
      id: String(ep.id),
      title: ep.name || `Episode ${ep.episode_number}`,
      episodeNumber: ep.episode_number,
      description: ep.overview || summary.title,
      durationMinutes: 45,
      thumbnailUrl: ep.still_path ? `${IMG}/w300${ep.still_path}` : summary.backdropUrl,
    }));

    const seasons: Season[] = [
      {
        id: "season-1",
        seasonNumber: 1,
        title: "Season 1",
        episodes,
      },
    ];

    return {
      ...summary,
      type: "series",
      synopsis: raw.overview || "No synopsis available.",
      cast,
      director,
      audioFormats: ["Dolby Digital 5.1"],
      subtitleLanguages: ["English", "Hindi"],
      watchProviders: [],
      watchLink: null,
      seasons,
    };
  }

  return {
    ...summary,
    type: "movie",
    synopsis: raw.overview || "No synopsis available.",
    cast,
    director,
    audioFormats: ["Dolby Digital 5.1"],
    subtitleLanguages: ["English", "Hindi"],
    watchProviders: [],
    watchLink: null,
    seasons: [],
  };
}

export async function getMediaBySlug(slug: string): Promise<MediaDetail | null> {
  return getMediaById(slug);
}

/**
 * Official YouTube trailer for a title (same movie-then-TV lookup as
 * getMediaById). The player plays this instead of a stream.
 */
export async function getTrailerKey(idStr: string): Promise<{ key: string; title: string } | null> {
  const media = await getMediaById(idStr);
  if (!media) return null;
  const kind = media.type === "series" ? "tv" : "movie";
  const videos = await fetchProxy<{ results?: { key: string; site: string; type: string; official?: boolean }[] }>(
    `/tmdb/${kind}/${media.id}/videos`
  );
  const rank = (v: { type: string; official?: boolean }) => (v.type === "Trailer" ? 0 : 2) + (v.official ? 0 : 1);
  const best = (videos?.results ?? [])
    .filter((v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"))
    .sort((a, b) => rank(a) - rank(b))[0];
  return best ? { key: best.key, title: media.title } : null;
}
