import { handleRoute, apiOk, requireViewer, NO_CACHE_HEADERS } from "@/server/http";
import { getContinueWatching } from "@/server/services/progress";

export async function GET() {
  return handleRoute(async () => {
    const viewer = await requireViewer();
    const items = await getContinueWatching(viewer.id);
    return apiOk({ items }, { headers: NO_CACHE_HEADERS });
  }, "GET /api/continue-watching");
}
