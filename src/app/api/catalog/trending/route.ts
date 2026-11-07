import { handleRoute, apiOk, CATALOG_CACHE_HEADERS } from "@/server/http";
import { getTrendingTitles } from "@/server/services/catalog";

export async function GET() {
  return handleRoute(async () => {
    const items = await getTrendingTitles();
    return apiOk({ items }, { headers: CATALOG_CACHE_HEADERS });
  }, "GET /api/catalog/trending");
}

