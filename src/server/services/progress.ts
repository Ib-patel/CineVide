import "server-only";
import { prisma } from "@/server/db";
import { toSummary } from "@/server/serializers";
import type { ContinueWatchingEntry, MediaSummary } from "@/types";

const MEDIA_INCLUDE = {
  genres: true,
  seasons: { select: { seasonNumber: true } },
} as const;

/** Content counts as finished once 95% has been watched. */
const COMPLETION_RATIO = 0.95;

export interface SaveProgressInput {
  userId: string;
  mediaId: string;
  episodeId?: string | null;
  positionSeconds: number;
  durationSeconds: number;
  completed?: boolean;
}

function isCompleted(input: SaveProgressInput): boolean {
  if (typeof input.completed === "boolean") return input.completed;
  if (input.durationSeconds > 0) {
    return input.positionSeconds / input.durationSeconds >= COMPLETION_RATIO;
  }
  return false;
}

export async function saveProgress(input: SaveProgressInput): Promise<ContinueWatchingEntry | null> {
  const media = await prisma.media.findFirst({
    where: { OR: [{ id: input.mediaId }, { slug: input.mediaId }] },
    include: MEDIA_INCLUDE,
  });
  if (!media) return null;

  let episodeId: string | null = null;
  if (input.episodeId) {
    const episode = await prisma.episode.findUnique({
      where: { id: input.episodeId },
      select: { id: true, season: { select: { mediaId: true } } },
    });
    if (episode && episode.season.mediaId === media.id) episodeId = episode.id;
  }

  const positionSeconds = Math.max(0, Math.floor(input.positionSeconds));
  const durationSeconds = Math.max(1, Math.floor(input.durationSeconds));
  const completed = isCompleted(input);

  const existing = await prisma.watchProgress.findFirst({
    where: { userId: input.userId, mediaId: media.id, episodeId },
    select: { id: true },
  });

  const data = { userId: input.userId, mediaId: media.id, episodeId, positionSeconds, durationSeconds, completed };

  if (existing) {
    await prisma.watchProgress.update({ where: { id: existing.id }, data });
  } else {
    await prisma.watchProgress.create({ data });
  }

  return continueWatchingEntry(media.id, episodeId);
}

export async function getProgress(
  userId: string,
  mediaId: string,
  episodeId?: string
): Promise<{ positionSeconds: number; durationSeconds: number; completed: boolean } | null> {
  const row = await prisma.watchProgress.findFirst({
    where: {
      userId,
      OR: [{ media: { id: mediaId } }, { media: { slug: mediaId } }],
      episodeId: episodeId ?? null,
    },
    select: { positionSeconds: true, durationSeconds: true, completed: true },
  });
  return row;
}

export async function getContinueWatching(userId: string, limit = 12): Promise<ContinueWatchingEntry[]> {
  const rows = await prisma.watchProgress.findMany({
    where: {
      userId,
      completed: false,
      media: { availability: "AVAILABLE" },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: { media: { include: MEDIA_INCLUDE }, episode: { include: { season: true } } },
  });
  return rows.map((row) => ({
    id: row.id,
    media: toSummary(row.media),
    episode: row.episode
      ? {
          id: row.episode.id,
          seasonNumber: row.episode.season.seasonNumber,
          episodeNumber: row.episode.episodeNumber,
          title: row.episode.title,
        }
      : null,
    progressSeconds: row.positionSeconds,
    durationSeconds: row.durationSeconds,
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function deleteUserProgress(userId: string, mediaId: string): Promise<boolean> {
  const result = await prisma.watchProgress.deleteMany({
    where: { userId, OR: [{ media: { id: mediaId } }, { media: { slug: mediaId } }] },
  });
  return result.count > 0;
}

async function continueWatchingEntry(mediaId: string, episodeId: string | null): Promise<ContinueWatchingEntry | null> {
  const row = await prisma.watchProgress.findFirst({
    where: { mediaId, episodeId, completed: false },
    include: { media: { include: MEDIA_INCLUDE }, episode: { include: { season: true } } },
  });
  if (!row) return null;
  return {
    id: row.id,
    media: toSummary(row.media),
    episode: row.episode
      ? {
          id: row.episode.id,
          seasonNumber: row.episode.season.seasonNumber,
          episodeNumber: row.episode.episodeNumber,
          title: row.episode.title,
        }
      : null,
    progressSeconds: row.positionSeconds,
    durationSeconds: row.durationSeconds,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listCompletedTitles(userId: string, limit = 20): Promise<MediaSummary[]> {
  const rows = await prisma.watchProgress.findMany({
    where: { userId, completed: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: { media: { include: MEDIA_INCLUDE } },
  });
  return rows.map((row) => toSummary(row.media));
}
