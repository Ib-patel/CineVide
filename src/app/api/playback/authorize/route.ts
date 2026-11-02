import { NextRequest } from "next/server";
import {
  handleRoute,
  apiOk,
  apiError,
  requireUser,
  enforceRateLimit,
  getClientIp,
  NO_CACHE_HEADERS,
} from "@/server/http";
import { playbackAuthorizeSchema } from "@/server/validators";
import { authorizePlayback, PlaybackNotAuthorizedError } from "@/server/playback/service";

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    // Rate limit playback authorization: 30 tokens per minute per IP
    const rateLimitRes = enforceRateLimit(request, "playback_auth", 30, 60 * 1000);
    if (rateLimitRes) return rateLimitRes;

    const user = await requireUser();
    const body = await request.json().catch(() => null);
    const parsed = playbackAuthorizeSchema.parse(body);

    const clientIp = getClientIp(request);
    // Header geo lookup fallback if available from reverse proxy
    const clientRegion = parsed.region || request.headers.get("x-vercel-ip-country") || undefined;

    try {
      const session = await authorizePlayback({
        userId: user.id,
        mediaId: parsed.mediaId,
        episodeId: parsed.episodeId,
        clientIp,
        clientRegion,
      });

      return apiOk(session, { headers: NO_CACHE_HEADERS });
    } catch (error) {
      if (error instanceof PlaybackNotAuthorizedError) {
        const status = error.code === "NOT_FOUND" ? 404 : 403;
        return apiError(status, error.code, error.message, { headers: NO_CACHE_HEADERS });
      }
      throw error;
    }
  }, "POST /api/playback/authorize");
}
