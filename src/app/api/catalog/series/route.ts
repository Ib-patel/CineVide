import { handleRoute, apiOk, CATALOG_CACHE_HEADERS } from "@/server/http";
import { listSeries } from "@/server/services/catalog";

export async function GET() {
  return handleRoute(async () => {
    const items = await listSeries();
    return apiOk({ items }, { headers: CATALOG_CACHE_HEADERS });
  }, "GET /api/catalog/series");
}

