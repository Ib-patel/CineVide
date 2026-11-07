import { NextRequest } from "next/server";
import { handleRoute, apiOk, CATALOG_CACHE_HEADERS, SEARCH_CACHE_HEADERS } from "@/server/http";
import { BROWSABLE_AVAILABILITY, listCatalog } from "@/server/services/catalog";
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

    // Free-text search also surfaces catalog-only (METADATA_ONLY) titles, like searchCatalog().
    const result = await listCatalog(
      parsed.q ? { ...parsed, availability: BROWSABLE_AVAILABILITY } : parsed
    );
    return apiOk(result, { headers: parsed.q ? SEARCH_CACHE_HEADERS : CATALOG_CACHE_HEADERS });
  }, "GET /api/catalog");
}

