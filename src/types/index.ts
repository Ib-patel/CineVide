export type MediaType = "movie" | "series";

export type Genre =
  | "Action"
  | "Adventure"
  | "Anime"
  | "Comedy"
  | "Crime"
  | "Cyberpunk"
  | "Drama"
  | "Fantasy"
  | "Horror"
  | "Mystery"
  | "Psychological"
  | "Romance"
  | "Sci-Fi"
  | "Thriller";

export type MaxResolution = "UHD 4K" | "Full HD" | "HD";

export type Availability =
  | "AVAILABLE"
  | "COMING_SOON"
  | "METADATA_ONLY"
  | "REGION_RESTRICTED"
  | "SUBSCRIPTION_REQUIRED"
  | "UNAVAILABLE";

export interface Episode {
  id: string;
  title: string;
  episodeNumber: number;
  description: string;
  durationMinutes: number;
  thumbnailUrl: string;
}

export interface Season {
  id: string;
  seasonNumber: number;
  title: string;
  episodes: Episode[];
}

/**
 * Card-safe media payload. Rendered by rows, cards, search results and the hero
 * without fetching full details. All catalog data comes from the database via
 * /api/catalog or server-side services.
 */
export interface MediaSummary {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  type: MediaType;
  genres: Genre[];
  posterUrl: string;
  backdropUrl: string;
  rating: number;
  releaseYear: number;
  runtimeMinutes: number | null;
  seasonsCount: number | null;
  ageRating: string;
  matchPercent: number;
  maxResolution: MaxResolution;
  isExclusive: boolean;
  availability: Availability;
  demoPreviewUrl: string;
  externalSource?: string;
  metadataAttribution?: string | null;
}

export interface PlaybackSession {
  mediaId: string;
  episodeId: string | null;
  playbackUrl: string;
  token: string;
  expiresAt: string;
  format: "hls" | "mp4";
  isDemo: boolean;
  provider: string;
  allowedRegions: string[];
}

/**
 * Full detail payload for the Quick Info modal. Includes optional display data
 * (cast, audio, subtitles) and seasons+episodes for series.
 */
export interface MovieDetail extends MediaSummary {
  type: "movie";
  synopsis: string;
  cast: string[];
  director: string;
  audioFormats: string[];
  subtitleLanguages: string[];
  seasons: [];
}

export interface SeriesDetail extends MediaSummary {
  type: "series";
  synopsis: string;
  cast: string[];
  director: string;
  audioFormats: string[];
  subtitleLanguages: string[];
  seasons: Season[];
}

export type MediaDetail = MovieDetail | SeriesDetail;

export interface ContinueWatchingEntry {
  id: string;
  media: MediaSummary;
  episode: {
    id: string;
    seasonNumber: number;
    episodeNumber: number;
    title: string;
  } | null;
  progressSeconds: number;
  durationSeconds: number;
  updatedAt: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

export interface CatalogNotification {
  id: string;
  title: string;
  message: string;
  imageUrl: string;
  timeLabel: string;
}

export interface FeaturedItem {
  mediaId: string;
  previewVideoUrl: string | null;
}

export type CatalogCategory =
  | "All"
  | "Movies"
  | "Series"
  | "Action"
  | "Sci-Fi"
  | "Drama"
  | "Thriller"
  | "Fantasy"
  | "Anime";

export const GENRE_VALUES: readonly Genre[] = [
  "Action",
  "Adventure",
  "Anime",
  "Comedy",
  "Crime",
  "Cyberpunk",
  "Drama",
  "Horror",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Thriller",
] as const;

export function isSeries(item: MediaSummary): item is Extract<MediaSummary, { type: "series" }> {
  return item.type === "series";
}

export function isSeriesDetail(item: MediaDetail): item is SeriesDetail {
  return item.type === "series";
}
