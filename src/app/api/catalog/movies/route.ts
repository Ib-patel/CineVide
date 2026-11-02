import { handleRoute, apiOk } from "@/server/http";
import { listMovies } from "@/server/services/catalog";

export async function GET() {
  return handleRoute(async () => {
    const items = await listMovies();
    return apiOk({ items });
  }, "GET /api/catalog/movies");
}

