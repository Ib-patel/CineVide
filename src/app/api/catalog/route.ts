import { NextRequest } from "next/server";
import { handleRoute, apiOk } from "@/server/http";
import { listCatalog } from "@/server/services/catalog";
import { catalogQuerySchema } from "@/server/validators";

export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const { searchParams } = new URL(request.url);
    const parsed = catalogQuerySchema.parse({
      type: searchParams.get("type") ?? undefined,
      genre: searchParams.get("genre") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const result = await listCatalog(parsed);
    return apiOk(result);
  }, "GET /api/catalog");
}

