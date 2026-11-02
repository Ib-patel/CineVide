import "server-only";
import type { Genre, MaxResolution, MediaType } from "@/types";

export interface ProviderEpisode {
  episodeNumber: number;
  title: string;
  description: string;
  durationMinutes: number;
  thumbnailUrl: string;
  externalId?: string;
}

export interface ProviderSeason {
  seasonNumber: number;
  title: string;
  episodes: ProviderEpisode[];
  externalId?: string;
}

export interface ProviderMediaItem {
  externalId: string;
  externalSource: "tmdb" | "omdb" | "manual";
  imdbId?: string | null;
  slug: string;
  title: string;
  tagline: string | null;
  synopsis: string;
  type: MediaType;
  posterUrl: string;
  backdropUrl: string;
  rating: number;
  releaseYear: number;
  runtimeMinutes: number | null;
  ageRating: string;
  matchPercent: number;
  maxResolution: MaxResolution;
  genres: Genre[];
  cast: string[];
  director: string;
  audioFormats: string[];
  subtitleLanguages: string[];
  seasons?: ProviderSeason[];
  metadataAttribution: string;
}

export interface CatalogProvider {
  name: string;
  search(query: string, type?: MediaType): Promise<ProviderMediaItem[]>;
  getMovieDetails(externalId: string): Promise<ProviderMediaItem | null>;
  getSeriesDetails(externalId: string): Promise<ProviderMediaItem | null>;
  getTrending(type?: MediaType): Promise<ProviderMediaItem[]>;
  getPopular(type?: MediaType): Promise<ProviderMediaItem[]>;
}
