import { NextRequest } from "next/server";
import { handleRoute, apiOk, requireUser, NO_CACHE_HEADERS } from "@/server/http";
import { getProgress, saveProgress } from "@/server/services/progress";
import { progressQuerySchema, progressSchema } from "@/server/validators";

export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const parsed = progressQuerySchema.parse({
      mediaId: searchParams.get("mediaId") ?? undefined,
      episodeId: searchParams.get("episodeId") ?? undefined,
    });
    const progress = await getProgress(user.id, parsed.mediaId, parsed.episodeId);
    return apiOk(progress, { headers: NO_CACHE_HEADERS });
  }, "GET /api/progress");
}

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const user = await requireUser();
    const body = await request.json().catch(() => null);
    const parsed = progressSchema.parse(body);
    const entry = await saveProgress({
      userId: user.id,
      mediaId: parsed.mediaId,
      episodeId: parsed.episodeId,
      positionSeconds: parsed.positionSeconds,
      durationSeconds: parsed.durationSeconds,
      completed: parsed.completed,
    });
    return apiOk({ saved: true, entry }, { headers: NO_CACHE_HEADERS });
  }, "POST /api/progress");
}
