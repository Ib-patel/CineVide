import { handleRoute, apiOk, requireUser, NO_CACHE_HEADERS } from "@/server/http";

export async function GET() {
  return handleRoute(async () => {
    const user = await requireUser();
    return apiOk({ user }, { headers: NO_CACHE_HEADERS });
  }, "GET /api/auth/me");
}
