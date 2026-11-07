import { handleRoute, apiOk, CATALOG_CACHE_HEADERS } from "@/server/http";
import { listMovies } from "@/server/services/catalog";

export async function GET() {
  return handleRoute(async () => {
    const items = await listMovies();
    return apiOk({ items }, { headers: CATALOG_CACHE_HEADERS });
  }, "GET /api/catalog/movies");
}

