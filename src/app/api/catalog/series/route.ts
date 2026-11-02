import { handleRoute, apiOk } from "@/server/http";
import { listSeries } from "@/server/services/catalog";

export async function GET() {
  return handleRoute(async () => {
    const items = await listSeries();
    return apiOk({ items });
  }, "GET /api/catalog/series");
}

