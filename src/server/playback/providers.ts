import "server-only";
import { createSign } from "node:crypto";
export interface PlaybackAsset {
  id?: string;
  mediaId?: string;
  episodeId?: string | null;
  playbackProvider: string;
  providerAssetId?: string | null;
  format: string;
  streamUrl: string;
  allowedRegions?: string;
}
import { env } from "@/server/env";
import { logger } from "@/server/lib/logger";

export interface ResolvedStream {
  playbackUrl: string;
  format: "hls" | "mp4" | "youtube" | "ogpb";
  provider: string;
  youtubeId?: string;
}

export interface StreamRequestContext {
  clientIp: string;
  userId: string;
  /** Cinevide HMAC playback token issued for this session. */
  playbackToken: string;
}

export interface VideoStreamProvider {
  name: string;
  resolveStream(asset: PlaybackAsset, ctx: StreamRequestContext): Promise<ResolvedStream>;
}

const SIGNED_URL_TTL_SECONDS = 15 * 60;

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function detectFormat(asset: PlaybackAsset): "hls" | "mp4" {
  if (asset.format === "mp4") return "mp4";
  if (asset.format === "hls" || asset.streamUrl.includes(".m3u8")) return "hls";
  return asset.streamUrl.toLowerCase().includes(".mp4") ? "mp4" : "hls";
}

/** Signs an RS256 JWT with a PEM private key (used by Mux and Cloudflare Stream). */
function signRs256Jwt(header: Record<string, unknown>, payload: Record<string, unknown>, pem: string): string {
  const h = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT", ...header })).toString("base64url");
  const p = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signer = createSign("RSA-SHA256");
  signer.update(`${h}.${p}`);
  return `${h}.${p}.${signer.sign(pem, "base64url")}`;
}

/**
 * Appends the Cinevide playback token so an edge proxy (nginx `auth_request`,
 * a Cloudflare Worker, …) can validate it against GET /api/playback/verify.
 * Opt-in via PLAYBACK_URL_TOKEN=true because third-party URLs don't expect it.
 */
function withEdgeToken(url: string, token: string): string {
  if (!env.playbackUrlToken) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("cv_token", token);
    return parsed.toString();
  } catch {
    return url;
  }
}

/** Direct HLS / MP4 from a CDN or origin you control. */
export class HlsDirectProvider implements VideoStreamProvider {
  name = "hls";

  async resolveStream(asset: PlaybackAsset, ctx: StreamRequestContext): Promise<ResolvedStream> {
    return {
      playbackUrl: withEdgeToken(asset.streamUrl, ctx.playbackToken),
      format: detectFormat(asset),
      provider: "hls",
    };
  }
}

/**
 * Public-domain / Creative Commons files on the Internet Archive. Served
 * directly (byte-range MP4, CORS-enabled); third-party URLs never get tokens.
 */
export class ArchiveProvider implements VideoStreamProvider {
  name = "archive";

  async resolveStream(asset: PlaybackAsset): Promise<ResolvedStream> {
    return { playbackUrl: asset.streamUrl, format: detectFormat(asset), provider: "archive" };
  }
}

/** "https://www.youtube-nocookie.com/embed/ID", "youtu.be/ID", "watch?v=ID" or a bare id → ID. */
export function youtubeIdFrom(value: string): string | null {
  const m = value.match(/(?:embed\/|youtu\.be\/|[?&]v=)([\w-]{11})/) ?? value.match(/^([\w-]{11})$/);
  return m ? m[1] : null;
}

/**
 * Full films and episodes uploaded by their rights holders to their official
 * YouTube channels. Played in YouTube's own embedded player (privacy-enhanced
 * youtube-nocookie domain), which is how YouTube's terms allow third-party sites
 * to show embeddable videos. Never proxied, downloaded or re-hosted.
 */
export class YouTubeProvider implements VideoStreamProvider {
  name = "youtube";

  async resolveStream(asset: PlaybackAsset): Promise<ResolvedStream> {
    const id = youtubeIdFrom(asset.providerAssetId ?? "") ?? youtubeIdFrom(asset.streamUrl);
    if (!id) throw new Error(`YouTube asset ${asset.id} has no video id`);
    return {
      playbackUrl: `https://www.youtube-nocookie.com/embed/${id}`,
      format: "youtube",
      provider: "youtube",
      youtubeId: id,
    };
  }
}

/** Demo preview footage: served as-is, never decorated with tokens. */
export class DemoProvider implements VideoStreamProvider {
  name = "demo";

  async resolveStream(asset: PlaybackAsset): Promise<ResolvedStream> {
    return { playbackUrl: asset.streamUrl, format: detectFormat(asset), provider: "demo" };
  }
}

/**
 * Mux Video. `providerAssetId` is the Mux *playback ID*. With MUX_SIGNING_KEY_ID
 * and MUX_PRIVATE_KEY set, a signed-policy JWT is attached; otherwise a public
 * playback URL is used. An absolute `streamUrl` is honoured when there is no
 * playback ID to sign, so hosted test streams keep working.
 */
export class MuxVideoProvider implements VideoStreamProvider {
  name = "mux";

  private getSigningKey(): { keyId: string; privateKey: string } | null {
    const keyId = process.env.MUX_SIGNING_KEY_ID;
    const privateKey = process.env.MUX_PRIVATE_KEY;
    if (keyId && privateKey) return { keyId, privateKey: privateKey.replace(/\\n/g, "\n") };
    return null;
  }

  async resolveStream(asset: PlaybackAsset): Promise<ResolvedStream> {
    const playbackId = asset.providerAssetId?.trim() || null;
    const signing = this.getSigningKey();

    if (playbackId && signing) {
      try {
        const exp = Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SECONDS;
        const token = signRs256Jwt({ kid: signing.keyId }, { sub: playbackId, aud: "v", exp, kid: signing.keyId }, signing.privateKey);
        return {
          playbackUrl: `https://stream.mux.com/${playbackId}.m3u8?token=${token}`,
          format: "hls",
          provider: "mux",
        };
      } catch (err) {
        logger.warn("Failed to generate Mux signed token, using unsigned URL", "MuxVideoProvider", undefined, err);
      }
    }

    let playbackUrl: string;
    if (isAbsoluteUrl(asset.streamUrl)) {
      playbackUrl = asset.streamUrl;
    } else {
      const id = playbackId || asset.streamUrl.split("/").pop()?.replace(".m3u8", "") || "";
      playbackUrl = `https://stream.mux.com/${id}.m3u8`;
    }

    return { playbackUrl, format: "hls", provider: "mux" };
  }
}

/**
 * Cloudflare Stream. `providerAssetId` is the video UID. Signed URLs need
 * CLOUDFLARE_STREAM_KEY_ID + CLOUDFLARE_STREAM_PEM; CLOUDFLARE_STREAM_CUSTOMER_CODE
 * selects the customer subdomain (falls back to videodelivery.net).
 */
export class CloudflareStreamProvider implements VideoStreamProvider {
  name = "cloudflare";

  private getKey(): { keyId: string; pem: string } | null {
    const keyId = process.env.CLOUDFLARE_STREAM_KEY_ID;
    const pem = process.env.CLOUDFLARE_STREAM_PEM;
    if (keyId && pem) return { keyId, pem: pem.replace(/\\n/g, "\n") };
    return null;
  }

  private manifestUrl(idOrToken: string): string {
    const customerCode = process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE;
    const host = customerCode ? `customer-${customerCode}.cloudflarestream.com` : "videodelivery.net";
    return `https://${host}/${idOrToken}/manifest/video.m3u8`;
  }

  async resolveStream(asset: PlaybackAsset): Promise<ResolvedStream> {
    const videoUid = asset.providerAssetId?.trim() || null;
    const key = this.getKey();

    if (videoUid && key) {
      try {
        const exp = Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SECONDS;
        const token = signRs256Jwt({ kid: key.keyId }, { sub: videoUid, kid: key.keyId, exp }, key.pem);
        return { playbackUrl: this.manifestUrl(token), format: "hls", provider: "cloudflare" };
      } catch (err) {
        logger.warn("Failed to generate Cloudflare Stream signed token", "CloudflareStreamProvider", undefined, err);
      }
    }

    const playbackUrl = isAbsoluteUrl(asset.streamUrl)
      ? asset.streamUrl
      : this.manifestUrl(videoUid || asset.streamUrl.split("/").filter(Boolean)[0] || "");

    return { playbackUrl, format: "hls", provider: "cloudflare" };
  }
}

/** AWS S3 + CloudFront (URL signing is expected to happen at CloudFront). */
export class S3CloudFrontProvider implements VideoStreamProvider {
  name = "s3_cloudfront";

  async resolveStream(asset: PlaybackAsset): Promise<ResolvedStream> {
    return { playbackUrl: asset.streamUrl, format: detectFormat(asset), provider: "s3_cloudfront" };
  }
}

const OGPB_EMBED = "https://embed.theogpiratebot.online";

export class OgpbProvider implements VideoStreamProvider {
  name = "ogpb";

  static movieEmbedUrl(tmdbId: number): string {
    return `${OGPB_EMBED}/embed/movie/${tmdbId}?color=ffffff&lang=hi&back=0&postMessage=1`;
  }

  static tvEmbedUrl(tmdbId: number, season = 1, episode = 1): string {
    return `${OGPB_EMBED}/embed/tv/${tmdbId}/${season}/${episode}?color=ffffff&lang=hi&back=0&postMessage=1&episodeSelector=false&autoplayNextEp=false`;
  }

  async resolveStream(asset: PlaybackAsset): Promise<ResolvedStream> {
    return { playbackUrl: asset.streamUrl, format: "ogpb", provider: "ogpb" };
  }
}

const providers: Record<string, VideoStreamProvider> = {
  hls: new HlsDirectProvider(),
  mux: new MuxVideoProvider(),
  cloudflare: new CloudflareStreamProvider(),
  s3_cloudfront: new S3CloudFrontProvider(),
  demo: new DemoProvider(),
  archive: new ArchiveProvider(),
  youtube: new YouTubeProvider(),
  ogpb: new OgpbProvider(),
};

export function getStreamProvider(name?: string): VideoStreamProvider {
  if (!name) return providers.hls;
  return providers[name.toLowerCase()] || providers.hls;
}
