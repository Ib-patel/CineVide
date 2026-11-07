import { handleRoute, apiOk, CATALOG_CACHE_HEADERS } from "@/server/http";
import { getTopRated } from "@/server/services/catalog";

export async function GET() {
  return handleRoute(async () => {
    const items = await getTopRated();
    return apiOk({ items }, { headers: CATALOG_CACHE_HEADERS });
  }, "GET /api/catalog/top-rated");
}

