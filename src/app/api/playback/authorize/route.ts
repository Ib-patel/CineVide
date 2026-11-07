import { NextRequest } from "next/server";
import {
  handleRoute,
  apiOk,
  apiError,
  enforceRateLimit,
  getClientIp,
  getClientRegion,
  NO_CACHE_HEADERS,
} from "@/server/http";
import { getViewer } from "@/server/viewer";
import { playbackAuthorizeSchema } from "@/server/validators";
import { authorizePlayback, PlaybackNotAuthorizedError } from "@/server/playback/service";

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    // Rate limit playback authorization: 30 tokens per minute per IP
    const rateLimitRes = enforceRateLimit(request, "playback_auth", 30, 60 * 1000);
    if (rateLimitRes) return rateLimitRes;

    const viewer = await getViewer();
    const body = await request.json().catch(() => null);
    const parsed = playbackAuthorizeSchema.parse(body);

    try {
      const session = await authorizePlayback({
        userId: viewer?.id ?? null,
        mediaId: parsed.mediaId,
        episodeId: parsed.episodeId,
        clientIp: getClientIp(request),
        // Region comes only from a trusted edge header, never from the request body.
        clientRegion: getClientRegion(request),
        allowDemo: parsed.allowDemo,
      });

      return apiOk(session, { headers: NO_CACHE_HEADERS });
    } catch (error) {
      if (error instanceof PlaybackNotAuthorizedError) {
        const status = error.code === "NOT_FOUND" ? 404 : error.code === "UNAUTHENTICATED" ? 401 : 403;
        return apiError(status, error.code, error.message, { headers: NO_CACHE_HEADERS });
      }
      throw error;
    }
  }, "POST /api/playback/authorize");
}
