import "server-only";
import { randomUUID } from "node:crypto";
import { getMediaById } from "@/server/services/catalog";
import type { ContinueWatchingEntry, MediaSummary } from "@/types";

const COMPLETION_RATIO = 0.95;

export interface SaveProgressInput {
  userId: string;
  mediaId: string;
  episodeId?: string | null;
  positionSeconds: number;
  durationSeconds: number;
  completed?: boolean;
}

interface StoredProgress {
  id: string;
  userId: string;
  mediaId: string;
  episodeId: string | null;
  positionSeconds: number;
  durationSeconds: number;
  completed: boolean;
  updatedAt: Date;
}

// In-memory progress store keyed by `userId:mediaId:episodeId`
const progressStore = new Map<string, StoredProgress>();

function makeKey(userId: string, mediaId: string, episodeId: string | null): string {
  return `${userId}:${mediaId}:${episodeId ?? "movie"}`;
}

function isCompleted(input: SaveProgressInput): boolean {
  if (typeof input.completed === "boolean") return input.completed;
  if (input.durationSeconds > 0) {
    return input.positionSeconds / input.durationSeconds >= COMPLETION_RATIO;
  }
  return false;
}

export async function saveProgress(input: SaveProgressInput): Promise<ContinueWatchingEntry | null> {
  const mediaId = input.mediaId;
  const episodeId = input.episodeId ?? null;
  const positionSeconds = Math.max(0, Math.floor(input.positionSeconds));
  const durationSeconds = Math.max(1, Math.floor(input.durationSeconds));
  const completed = isCompleted(input);

  const key = makeKey(input.userId, mediaId, episodeId);
  const existing = progressStore.get(key);

  const record: StoredProgress = {
    id: existing?.id ?? randomUUID(),
    userId: input.userId,
    mediaId,
    episodeId,
    positionSeconds,
    durationSeconds,
    completed,
    updatedAt: new Date(),
  };

  progressStore.set(key, record);

  if (completed) return null;

  const media = await getMediaById(mediaId);
  if (!media) return null;

  return {
    id: record.id,
    media,
    episode: episodeId
      ? {
          id: episodeId,
          seasonNumber: 1,
          episodeNumber: Number(episodeId) || 1,
          title: `Episode ${episodeId}`,
        }
      : null,
    progressSeconds: positionSeconds,
    durationSeconds,
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getProgress(
  userId: string,
  mediaId: string,
  episodeId?: string
): Promise<{ positionSeconds: number; durationSeconds: number; completed: boolean } | null> {
  const key = makeKey(userId, mediaId, episodeId ?? null);
  const found = progressStore.get(key);
  if (!found) return null;
  return {
    positionSeconds: found.positionSeconds,
    durationSeconds: found.durationSeconds,
    completed: found.completed,
  };
}

export async function getContinueWatching(userId: string, limit = 12): Promise<ContinueWatchingEntry[]> {
  const userEntries = Array.from(progressStore.values())
    .filter((e) => e.userId === userId && !e.completed)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit);

  const results: ContinueWatchingEntry[] = [];
  for (const entry of userEntries) {
    const media = await getMediaById(entry.mediaId);
    if (!media) continue;
    results.push({
      id: entry.id,
      media,
      episode: entry.episodeId
        ? {
            id: entry.episodeId,
            seasonNumber: 1,
            episodeNumber: Number(entry.episodeId) || 1,
            title: `Episode ${entry.episodeId}`,
          }
        : null,
      progressSeconds: entry.positionSeconds,
      durationSeconds: entry.durationSeconds,
      updatedAt: entry.updatedAt.toISOString(),
    });
  }
  return results;
}

export async function deleteUserProgress(userId: string, mediaId: string): Promise<boolean> {
  let deleted = false;
  for (const [key, entry] of progressStore.entries()) {
    if (entry.userId === userId && entry.mediaId === mediaId) {
      progressStore.delete(key);
      deleted = true;
    }
  }
  return deleted;
}

export async function listCompletedTitles(userId: string, limit = 20): Promise<MediaSummary[]> {
  const userEntries = Array.from(progressStore.values())
    .filter((e) => e.userId === userId && e.completed)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit);

  const results: MediaSummary[] = [];
  for (const entry of userEntries) {
    const media = await getMediaById(entry.mediaId);
    if (media) results.push(media);
  }
  return results;
}
