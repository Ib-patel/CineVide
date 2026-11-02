import { handleRoute, apiOk } from "@/server/http";
import { getTopRated } from "@/server/services/catalog";

export async function GET() {
  return handleRoute(async () => {
    const items = await getTopRated();
    return apiOk({ items });
  }, "GET /api/catalog/top-rated");
}

