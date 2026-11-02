import { handleRoute, apiOk } from "@/server/http";
import { getTrendingTitles } from "@/server/services/catalog";

export async function GET() {
  return handleRoute(async () => {
    const items = await getTrendingTitles();
    return apiOk({ items });
  }, "GET /api/catalog/trending");
}

