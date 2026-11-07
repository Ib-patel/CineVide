import { handleRoute, apiOk, CATALOG_CACHE_HEADERS } from "@/server/http";
import { getRecentlyAdded } from "@/server/services/catalog";

/** Most recently added streamable titles — powers the header's "New on Cinevide". */
export async function GET() {
  return handleRoute(async () => apiOk(await getRecentlyAdded(8), { headers: CATALOG_CACHE_HEADERS }), "GET /api/catalog/new");
}
