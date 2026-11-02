import { NextRequest } from "next/server";
import { handleRoute, apiOk, apiError, requireUser, NO_CACHE_HEADERS } from "@/server/http";
import { addToWatchlist, getUserWatchlist } from "@/server/services/watchlist";

export async function GET() {
  return handleRoute(async () => {
    const user = await requireUser();
    const items = await getUserWatchlist(user.id);
    return apiOk({ items }, { headers: NO_CACHE_HEADERS });
  }, "GET /api/watchlist");
}

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const user = await requireUser();
    const body = (await request.json().catch(() => null)) as { mediaId?: string } | null;
    const mediaId = body?.mediaId;
    if (!mediaId || typeof mediaId !== "string") {
      return apiError(400, "INVALID_INPUT", "mediaId is required", { headers: NO_CACHE_HEADERS });
    }
    const created = await addToWatchlist(user.id, mediaId);
    return apiOk({ created }, { status: created ? 201 : 200, headers: NO_CACHE_HEADERS });
  }, "POST /api/watchlist");
}
