import { NextRequest } from "next/server";
import { handleRoute, apiOk, requireUser, NO_CACHE_HEADERS } from "@/server/http";
import { removeFromWatchlist } from "@/server/services/watchlist";

export async function DELETE(
  _request: NextRequest,
  segmentData: { params: Promise<{ mediaId: string }> }
) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { mediaId } = await segmentData.params;
    const removed = await removeFromWatchlist(user.id, mediaId);
    return apiOk({ removed }, { headers: NO_CACHE_HEADERS });
  }, "DELETE /api/watchlist/[mediaId]");
}
