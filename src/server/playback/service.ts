import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/server/env";
import { extractIdFromSlug, getMediaById } from "@/server/services/catalog";
import { OgpbProvider } from "@/server/playback/providers";
import type { PlaybackSession } from "@/types";

export class PlaybackNotAuthorizedError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "PlaybackNotAuthorizedError";
    this.code = code;
  }
}

export interface PlaybackTokenPayload {
  userId: string | null;
  mediaId: string;
  episodeId: string | null;
  clientIp: string;
  expiresAt: number;
}

export function signPlaybackToken(payload: PlaybackTokenPayload): string {
  const json = JSON.stringify(payload);
  const b64Data = Buffer.from(json).toString("base64url");
  const signature = createHmac("sha256", env.playbackTokenSecret)
    .update(b64Data)
    .digest("base64url");
  return `${b64Data}.${signature}`;
}

export function verifyPlaybackToken(token: string): PlaybackTokenPayload | null {
  const [b64Data, signature] = token.split(".");
  if (!b64Data || !signature) return null;

  const expected = createHmac("sha256", env.playbackTokenSecret)
    .update(b64Data)
    .digest("base64url");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(b64Data, "base64url").toString("utf-8")) as PlaybackTokenPayload;
    if (Date.now() > payload.expiresAt) return null;
    return payload;
  } catch {
    return null;
  }
}

export interface AuthorizePlaybackParams {
  userId: string | null;
  mediaId: string;
  episodeId?: string | null;
  clientIp: string;
  clientRegion?: string;
  allowDemo?: boolean;
}

export async function authorizePlayback({
  userId,
  mediaId,
  episodeId,
  clientIp,
}: AuthorizePlaybackParams): Promise<PlaybackSession> {
  const { id: tmdbId } = extractIdFromSlug(mediaId);

  if (!tmdbId) {
    throw new PlaybackNotAuthorizedError("NOT_FOUND", "Requested title was not found.");
  }

  // Lookup title metadata to distinguish movies vs TV series and resolve episode titles
  const media = await getMediaById(mediaId).catch(() => null);
  const isTv = Boolean(episodeId) || media?.type === "series";

  let season = 1;
  let episode = 1;
  let episodeTitle: string | null = null;

  if (isTv) {
    if (episodeId) {
      const num = Number(episodeId);
      if (!Number.isNaN(num) && num < 100) {
        episode = num;
      }
      if (media && "seasons" in media && media.seasons.length > 0) {
        const found = media.seasons[0]?.episodes.find(
          (e) => e.id === episodeId || String(e.episodeNumber) === episodeId
        );
        if (found) {
          episode = found.episodeNumber;
          episodeTitle = found.title;
        }
      }
    }
    if (!episodeTitle) {
      episodeTitle = `Episode ${episode}`;
    }
  }

  const playbackUrl = isTv
    ? OgpbProvider.tvEmbedUrl(tmdbId, season, episode)
    : OgpbProvider.movieEmbedUrl(tmdbId);

  const expiresAtMs = Date.now() + 15 * 60 * 1000;
  const token = signPlaybackToken({
    userId,
    mediaId,
    episodeId: episodeId ?? null,
    clientIp,
    expiresAt: expiresAtMs,
  });

  const title = media?.title || `Stream #${tmdbId}`;

  return {
    mediaId,
    episodeId: episodeId ?? null,
    playbackUrl,
    token,
    expiresAt: new Date(expiresAtMs).toISOString(),
    format: "ogpb",
    isDemo: false,
    isTrailer: false,
    provider: "ogpb",
    allowedRegions: ["GLOBAL"],
    title,
    episodeTitle: isTv ? episodeTitle : null,
    seasonNumber: isTv ? season : null,
    episodeNumber: isTv ? episode : null,
    startSeconds: 0,
    durationSeconds: isTv ? 45 * 60 : 120 * 60,
    nextEpisode: isTv
      ? {
          id: String(episode + 1),
          seasonNumber: season,
          episodeNumber: episode + 1,
          title: `Episode ${episode + 1}`,
        }
      : null,
    previousEpisode: isTv && episode > 1
      ? {
          id: String(episode - 1),
          seasonNumber: season,
          episodeNumber: episode - 1,
          title: `Episode ${episode - 1}`,
        }
      : null,
  };
}
