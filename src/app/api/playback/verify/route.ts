import { NextRequest } from "next/server";
import { handleRoute, apiOk, apiError, NO_CACHE_HEADERS } from "@/server/http";
import { verifyPlaybackToken } from "@/server/playback/service";

/**
 * Edge validation hook for playback tokens.
 *
 * Point an nginx `auth_request`, Cloudflare Worker or similar at this endpoint
 * with the `cv_token` from the manifest URL (enable PLAYBACK_URL_TOKEN=true).
 * Responds 200 with the token's media scope when valid, 401 otherwise.
 * Optional `mediaId` narrows the check to a single title.
 */
export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token") || searchParams.get("cv_token") || "";
    const mediaId = searchParams.get("mediaId");

    const payload = token ? verifyPlaybackToken(token) : null;
    if (!payload || (mediaId && payload.mediaId !== mediaId)) {
      return apiError(401, "INVALID_PLAYBACK_TOKEN", "Playback token is invalid or expired.", {
        headers: NO_CACHE_HEADERS,
      });
    }

    return apiOk(
      { mediaId: payload.mediaId, episodeId: payload.episodeId, expiresAt: payload.expiresAt },
      { headers: NO_CACHE_HEADERS }
    );
  }, "GET /api/playback/verify");
}
