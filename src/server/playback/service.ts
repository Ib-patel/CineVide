import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/server/db";
import { env } from "@/server/env";
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
  userId: string;
  mediaId: string;
  episodeId: string | null;
  clientIp: string;
  expiresAt: number; // Unix timestamp in ms
}

/** Signs a 15-minute tamper-proof playback token using HMAC-SHA256. */
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
  userId: string;
  mediaId: string;
  episodeId?: string | null;
  clientIp: string;
  clientRegion?: string;
}

export async function authorizePlayback({
  userId,
  mediaId,
  episodeId,
  clientIp,
  clientRegion,
}: AuthorizePlaybackParams): Promise<PlaybackSession> {
  const media = await prisma.media.findFirst({
    where: { OR: [{ id: mediaId }, { slug: mediaId }] },
    include: {
      playbackAssets: {
        where: {
          status: "ACTIVE",
          episodeId: episodeId ?? null,
        },
      },
    },
  });

  if (!media) {
    throw new PlaybackNotAuthorizedError("NOT_FOUND", "Requested title was not found.");
  }

  // Check availability status
  if (media.availability === "METADATA_ONLY") {
    throw new PlaybackNotAuthorizedError(
      "NOT_STREAMABLE",
      "This title is in the catalog for browsing only. Streaming license is not active."
    );
  }

  if (media.availability === "COMING_SOON") {
    throw new PlaybackNotAuthorizedError(
      "COMING_SOON",
      "This title is not yet available for streaming."
    );
  }

  if (media.availability === "UNAVAILABLE") {
    throw new PlaybackNotAuthorizedError(
      "UNAVAILABLE",
      "Streaming rights for this title have expired."
    );
  }

  const asset = media.playbackAssets[0];
  const now = new Date();

  // If a dedicated PlaybackAsset is present, enforce license window and geographic restrictions
  if (asset) {
    if (asset.licenseStart && now < asset.licenseStart) {
      throw new PlaybackNotAuthorizedError(
        "NOT_YET_LICENSED",
        "Playback license window has not begun."
      );
    }
    if (asset.licenseEnd && now > asset.licenseEnd) {
      throw new PlaybackNotAuthorizedError(
        "LICENSE_EXPIRED",
        "Playback license for this title has expired."
      );
    }

    let allowedRegions: string[] = ["GLOBAL"];
    try {
      allowedRegions = JSON.parse(asset.allowedRegions) as string[];
    } catch {
      allowedRegions = ["GLOBAL"];
    }

    if (
      clientRegion &&
      !allowedRegions.includes("GLOBAL") &&
      !allowedRegions.includes(clientRegion.toUpperCase())
    ) {
      throw new PlaybackNotAuthorizedError(
        "REGION_RESTRICTED",
        `This content is not licensed for playback in region ${clientRegion.toUpperCase()}.`
      );
    }

    const expiresAtMs = Date.now() + 15 * 60 * 1000;
    const token = signPlaybackToken({
      userId,
      mediaId: media.id,
      episodeId: episodeId ?? null,
      clientIp,
      expiresAt: expiresAtMs,
    });

    const isHls = asset.playbackProvider === "hls" || asset.streamUrl.endsWith(".m3u8");

    return {
      mediaId: media.id,
      episodeId: episodeId ?? null,
      playbackUrl: asset.streamUrl,
      token,
      expiresAt: new Date(expiresAtMs).toISOString(),
      format: isHls ? "hls" : "mp4",
      isDemo: asset.playbackProvider === "demo",
      provider: asset.playbackProvider,
      allowedRegions,
    };
  }

  // Fallback to demo preview asset if available
  const expiresAtMs = Date.now() + 15 * 60 * 1000;
  const token = signPlaybackToken({
    userId,
    mediaId: media.id,
    episodeId: episodeId ?? null,
    clientIp,
    expiresAt: expiresAtMs,
  });

  return {
    mediaId: media.id,
    episodeId: episodeId ?? null,
    playbackUrl: media.demoPreviewUrl,
    token,
    expiresAt: new Date(expiresAtMs).toISOString(),
    format: "mp4",
    isDemo: true,
    provider: "demo",
    allowedRegions: ["GLOBAL"],
  };
}
