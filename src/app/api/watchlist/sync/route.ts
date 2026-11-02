import { NextRequest } from "next/server";
import { handleRoute, apiOk, requireUser, NO_CACHE_HEADERS } from "@/server/http";
import { syncGuestWatchlist } from "@/server/services/watchlist";
import { watchlistSyncSchema } from "@/server/validators";

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const user = await requireUser();
    const body = await request.json().catch(() => null);
    const parsed = watchlistSyncSchema.parse(body);
    const items = await syncGuestWatchlist(user.id, parsed.ids);
    return apiOk({ items }, { headers: NO_CACHE_HEADERS });
  }, "POST /api/watchlist/sync");
}
