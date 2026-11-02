import { handleRoute, apiOk, requireUser, NO_CACHE_HEADERS } from "@/server/http";
import { getContinueWatching } from "@/server/services/progress";

export async function GET() {
  return handleRoute(async () => {
    const user = await requireUser();
    const items = await getContinueWatching(user.id);
    return apiOk({ items }, { headers: NO_CACHE_HEADERS });
  }, "GET /api/continue-watching");
}
