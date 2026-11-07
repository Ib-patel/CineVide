export type MediaType = "movie" | "series";

export type Genre =
  | "Action"
  | "Adventure"
  | "Anime"
  | "Comedy"
  | "Crime"
  | "Cyberpunk"
  | "Documentary"
  | "Drama"
  | "Family"
  | "Fantasy"
  | "History"
  | "Horror"
  | "Music"
  | "Mystery"
  | "Psychological"
  | "Romance"
  | "Sci-Fi"
  | "Thriller"
  | "War"
  | "Western";

/** Derived from the actual video file's height at import time. */
export type MaxResolution = "UHD 4K" | "Full HD" | "HD" | "SD";

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
  /** Official YouTube trailer, playable even when the full title isn't streamable here. */
  trailerYoutubeId?: string | null;
  /** Rights-holder channel when the full title streams from YouTube. */
  sourceChannel?: string | null;
}

/** A legal place to watch a title in the viewer's region (from TMDB / JustWatch). */
export interface WatchProvider {
  name: string;
  logoUrl: string;
  kind: "free" | "ads" | "flatrate" | "rent" | "buy";
}

/** Full title streams here, or (for latest releases) its official trailer does. */
export function canPlay(item: Pick<MediaSummary, "availability" | "trailerYoutubeId">): boolean {
  return item.availability === "AVAILABLE" || Boolean(item.trailerYoutubeId);
}

/** True when the play button would only show a trailer. */
export function isTrailerOnly(item: Pick<MediaSummary, "availability" | "trailerYoutubeId">): boolean {
  return item.availability !== "AVAILABLE" && Boolean(item.trailerYoutubeId);
}

export interface PlaybackSession {
  mediaId: string;
  episodeId: string | null;
  playbackUrl: string;
  token: string;
  expiresAt: string;
  format: "hls" | "mp4" | "youtube" | "ogpb";
  isDemo: boolean;
  /** Official trailer of a title that can't be streamed in full here. */
  isTrailer?: boolean;
  /** YouTube video id when `format` is "youtube". */
  youtubeId?: string | null;
  sourceChannel?: string | null;
  provider: string;
  allowedRegions: string[];
  title?: string;
  episodeTitle?: string | null;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
  startSeconds?: number;
  durationSeconds?: number;
  subtitles?: { label: string; language: string; src: string }[];
  nextEpisode?: { id: string; seasonNumber: number; episodeNumber: number; title: string } | null;
  previousEpisode?: { id: string; seasonNumber: number; episodeNumber: number; title: string } | null;
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
  watchProviders: WatchProvider[];
  watchLink: string | null;
  seasons: [];
}

export interface SeriesDetail extends MediaSummary {
  type: "series";
  synopsis: string;
  cast: string[];
  director: string;
  audioFormats: string[];
  subtitleLanguages: string[];
  watchProviders: WatchProvider[];
  watchLink: string | null;
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

/** "All", "Movies", "Series", or any genre present in the catalog (data-driven). */
export type CatalogCategory = "All" | "Movies" | "Series" | Genre | (string & {});

export const GENRE_VALUES: readonly Genre[] = [
  "Action",
  "Adventure",
  "Anime",
  "Comedy",
  "Crime",
  "Cyberpunk",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Music",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "War",
  "Western",
] as const;

export function isSeries(item: MediaSummary): item is Extract<MediaSummary, { type: "series" }> {
  return item.type === "series";
}

export function isSeriesDetail(item: MediaDetail): item is SeriesDetail {
  return item.type === "series";
}
