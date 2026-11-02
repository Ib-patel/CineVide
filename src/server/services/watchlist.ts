import "server-only";
import { prisma } from "@/server/db";
import { toSummary } from "@/server/serializers";
import type { MediaSummary, SessionUser } from "@/types";

const INCLUDE = { genres: true, seasons: { select: { seasonNumber: true } } } as const;

export async function getUserWatchlist(userId: string): Promise<MediaSummary[]> {
  const rows = await prisma.watchlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { media: { include: INCLUDE } },
  });
  return rows.map((row) => toSummary(row.media));
}

/** Returns true when the entry was newly created (false if it already existed). */
export async function addToWatchlist(userId: string, mediaId: string): Promise<boolean> {
  const media = await prisma.media.findFirst({
    where: { OR: [{ id: mediaId }, { slug: mediaId }] },
    select: { id: true },
  });
  if (!media) return false;
  const existing = await prisma.watchlistItem.findUnique({
    where: { userId_mediaId: { userId, mediaId: media.id } },
    select: { id: true },
  });
  if (existing) return false;
  await prisma.watchlistItem.create({ data: { userId, mediaId: media.id } });
  return true;
}

export async function removeFromWatchlist(userId: string, mediaId: string): Promise<boolean> {
  const item = await prisma.watchlistItem.findFirst({
    where: { userId, OR: [{ media: { id: mediaId } }, { media: { slug: mediaId } }] },
    select: { id: true },
  });
  if (!item) return false;
  await prisma.watchlistItem.delete({ where: { id: item.id } });
  return true;
}

/**
 * Migrates a guest watchlist after sign-in. Unknown/retired ids are ignored so
 * client data can never create ghost rows. Returns the merged list.
 */
export async function syncGuestWatchlist(userId: string, guestIds: string[]): Promise<MediaSummary[]> {
  const valid = guestIds.filter((id) => typeof id === "string" && id.length > 0).slice(0, 200);
  if (valid.length > 0) {
    const mediaRows = await prisma.media.findMany({
      where: { OR: valid.map((id) => ({ OR: [{ id }, { slug: id }] })) },
      select: { id: true, createdAt: true },
    });
    if (mediaRows.length > 0) {
      await prisma.watchlistItem.createMany({
        data: mediaRows.map((media) => ({ userId, mediaId: media.id })),
        skipDuplicates: true,
      });
    }
  }
  return getUserWatchlist(userId);
}

export async function requireUserAccess(user: SessionUser): Promise<string> {
  return user.id;
}
