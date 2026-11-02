import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { toDetail, toSummary } from "@/server/serializers";
import type { MediaDetail, MediaSummary } from "@/types";

const LIST_INCLUDE = { genres: true, seasons: { select: { seasonNumber: true } } } as const;
const DETAIL_INCLUDE = { genres: true, seasons: { include: { episodes: true } } } as const;

export interface CatalogQueryParams {
  type?: "movie" | "series";
  genre?: string;
  q?: string;
  sort?: "rating" | "year" | "popularity";
  cursor?: number; // offset cursor: last item index returned
  limit?: number; // default 24
}

export interface CatalogListResult {
  data: MediaSummary[];
  nextCursor: number | null;
  total: number;
}

function buildWhere(params: CatalogQueryParams): Prisma.MediaWhereInput {
  const where: Prisma.MediaWhereInput = {
    availability: "AVAILABLE",
  };
  if (params.type === "movie") where.type = "MOVIE";
  if (params.type === "series") where.type = "SERIES";
  if (params.genre) where.genres = { some: { genre: params.genre } };
  const q = params.q?.trim();
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { genres: { some: { genre: { contains: q, mode: "insensitive" } } } },
    ];
  }
  return where;
}

function buildOrderBy(
  sort: CatalogQueryParams["sort"]
): Prisma.MediaOrderByWithRelationInput {
  switch (sort) {
    case "year":
      return { releaseYear: "desc" };
    case "popularity":
      return { popularity: "desc" };
    default:
      return { rating: "desc" };
  }
}

export async function listCatalog(params: CatalogQueryParams): Promise<CatalogListResult> {
  const limit = params.limit ?? 24;
  const where = buildWhere(params);
  const [rows, total] = await Promise.all([
    prisma.media.findMany({
      where,
      orderBy: buildOrderBy(params.sort),
      skip: params.cursor ?? 0,
      take: limit,
      include: LIST_INCLUDE,
    }),
    prisma.media.count({ where }),
  ]);
  const data = rows.map(toSummary);
  const nextIndex = (params.cursor ?? 0) + rows.length;
  return { data, nextCursor: nextIndex < total ? nextIndex : null, total };
}

export async function listMovies(limit = 50): Promise<MediaSummary[]> {
  const { data } = await listCatalog({ type: "movie", sort: "rating", limit });
  return data;
}

export async function listSeries(limit = 50): Promise<MediaSummary[]> {
  const { data } = await listCatalog({ type: "series", sort: "rating", limit });
  return data;
}

export async function searchCatalog(query: string, limit = 12): Promise<MediaSummary[]> {
  return listCatalog({ q: query, limit }).then((result) => result.data);
}

export async function getTrendingTitles(limit = 10): Promise<MediaSummary[]> {
  const rows = await prisma.media.findMany({
    where: { availability: "AVAILABLE", trendingRank: { not: null } },
    orderBy: { trendingRank: "asc" },
    take: limit,
    include: LIST_INCLUDE,
  });
  return rows.map(toSummary);
}

export async function getPopularTitles(limit = 12): Promise<MediaSummary[]> {
  const rows = await prisma.media.findMany({
    where: {
      availability: "AVAILABLE",
      type: "MOVIE",
      popularity: { not: null },
    },
    orderBy: { popularity: "asc" },
    take: limit,
    include: LIST_INCLUDE,
  });
  return rows.map(toSummary);
}

export async function getBingeWorthySeries(limit = 10): Promise<MediaSummary[]> {
  const rows = await prisma.media.findMany({
    where: { availability: "AVAILABLE", type: "SERIES", popularity: { not: null } },
    orderBy: { popularity: "asc" },
    take: limit,
    include: LIST_INCLUDE,
  });
  return rows.map(toSummary);
}

export async function getExclusives(limit = 10): Promise<MediaSummary[]> {
  const rows = await prisma.media.findMany({
    where: { availability: "AVAILABLE", isExclusive: true },
    orderBy: [{ popularity: "asc" }, { rating: "desc" }],
    take: limit,
    include: LIST_INCLUDE,
  });
  return rows.map(toSummary);
}

export async function getTopRated(limit = 12): Promise<MediaSummary[]> {
  const { data } = await listCatalog({ sort: "rating", limit });
  return data;
}

export async function getMediaBySlug(slug: string): Promise<MediaDetail | null> {
  const row = await prisma.media.findUnique({
    where: { slug },
    include: DETAIL_INCLUDE,
  });
  return row ? toDetail(row) : null;
}

export async function getMediaById(id: string): Promise<MediaDetail | null> {
  const row = await prisma.media.findUnique({
    where: { id },
    include: DETAIL_INCLUDE,
  });
  return row ? toDetail(row) : null;
}

export interface FeaturedWithPreview {
  media: MediaDetail;
  previewVideoUrl: string | null;
}

export async function getFeaturedTitles(): Promise<FeaturedWithPreview[]> {
  const rows = await prisma.media.findMany({
    where: { availability: "AVAILABLE", isFeatured: true },
    orderBy: { featuredOrder: "asc" },
    include: DETAIL_INCLUDE,
  });
  return rows.map((row) => ({
    media: toDetail(row),
    previewVideoUrl: row.demoPreviewUrl ?? null,
  }));
}

/** Genre facets for filter UIs (count per genre among available titles). */
export async function getGenreFacets(): Promise<{ genre: string; count: number }[]> {
  const genres = await prisma.mediaGenre.groupBy({
    by: ["genre"],
    _count: { genre: true },
    where: { media: { availability: "AVAILABLE" } },
  });
  return genres.map((g) => ({ genre: g.genre, count: g._count.genre }));
}
