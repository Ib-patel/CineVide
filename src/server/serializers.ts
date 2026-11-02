import "server-only";
import { GENRE_VALUES, type Availability, type Episode, type Genre, type MaxResolution, type MediaDetail, type MediaSummary, type MediaType, type Season } from "@/types";

type MediaRowRel = {
  seasons: { seasonNumber: number }[];
};

type MediaRowBase = {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  type: "MOVIE" | "SERIES";
  posterUrl: string;
  backdropUrl: string;
  releaseYear: number;
  rating: { toNumber: () => number } | number;
  runtimeMinutes: number | null;
  ageRating: string;
  matchPercent: number;
  maxResolution: string;
  isExclusive: boolean;
  availability: string;
  demoPreviewUrl: string;
  externalSource?: string;
  metadataAttribution?: string | null;
  genres: { genre: string }[];
};

function parseJsonArray(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function normalizeGenres(row: MediaRowBase): Genre[] {
  const allowed = new Set<string>(GENRE_VALUES);
  const genres = row.genres
    .map((g) => g.genre)
    .filter((g): g is Genre => allowed.has(g));
  return genres;
}

function normalizeResolution(value: string): MaxResolution {
  return value === "UHD 4K" || value === "HD" ? value : "Full HD";
}

export function toSummary(row: MediaRowBase & Partial<MediaRowRel>): MediaSummary {
  const rating = typeof row.rating === "number" ? row.rating : row.rating.toNumber();
  const isSeriesRow = row.type === "SERIES";
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    type: row.type === "MOVIE" ? "movie" : "series",
    genres: normalizeGenres(row),
    posterUrl: row.posterUrl,
    backdropUrl: row.backdropUrl,
    rating,
    releaseYear: row.releaseYear,
    runtimeMinutes: row.runtimeMinutes,
    seasonsCount: isSeriesRow ? (row.seasons?.length ?? 0) : null,
    ageRating: row.ageRating,
    matchPercent: row.matchPercent,
    maxResolution: normalizeResolution(row.maxResolution),
    isExclusive: row.isExclusive,
    availability: row.availability as Availability,
    demoPreviewUrl: row.demoPreviewUrl,
    externalSource: row.externalSource,
    metadataAttribution: row.metadataAttribution,
  };
}

type EpisodeRow = {
  id: string;
  title: string;
  episodeNumber: number;
  description: string;
  durationMinutes: number;
  thumbnailUrl: string;
};

type SeasonRow = EpisodeRowSeason & { episodes: EpisodeRow[] };

type EpisodeRowSeason = {
  id: string;
  seasonNumber: number;
  title: string;
};

function toSeason(row: SeasonRow): Season {
  return {
    id: row.id,
    seasonNumber: row.seasonNumber,
    title: row.title,
    episodes: row.episodes
      .slice()
      .sort((a, b) => a.episodeNumber - b.episodeNumber)
      .map((episode): Episode => {
        const {
          id, title, episodeNumber, description, durationMinutes, thumbnailUrl,
        } = episode as EpisodeRow;
        return {
          id, title, episodeNumber, description, durationMinutes, thumbnailUrl,
        };
      }),
  };
}

type MediaDetailRel = {
  seasons: SeasonRow[];
};

type MediaDetailRow = MediaRowBase & {
  synopsis: string;
  castJson: string;
  director: string;
  audioFormats: string;
  subtitleLanguages: string;
} & Partial<MediaDetailRel>;

export function toDetail(row: MediaDetailRow): MediaDetail {
  const summary = toSummary(row);
  const isSeriesRow = row.type === "SERIES";
  const seasons = isSeriesRow
    ? (row.seasons ?? [])
        .slice()
        .sort((a, b) => a.seasonNumber - b.seasonNumber)
        .map(toSeason)
    : [];
  const type: MediaType = row.type === "MOVIE" ? "movie" : "series";
  return {
    ...summary,
    type,
    synopsis: row.synopsis,
    cast: parseJsonArray(row.castJson),
    director: row.director,
    audioFormats: parseJsonArray(row.audioFormats),
    subtitleLanguages: parseJsonArray(row.subtitleLanguages),
    seasons: type === "movie" ? ([] as MediaDetail["seasons"]) : seasons,
  } as MediaDetail;
}
