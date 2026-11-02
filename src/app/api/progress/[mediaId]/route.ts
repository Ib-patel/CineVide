import { NextRequest } from "next/server";
import { handleRoute, apiOk, requireUser, NO_CACHE_HEADERS } from "@/server/http";
import { deleteUserProgress } from "@/server/services/progress";

export async function DELETE(
  _request: NextRequest,
  segmentData: { params: Promise<{ mediaId: string }> }
) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { mediaId } = await segmentData.params;
    const deleted = await deleteUserProgress(user.id, mediaId);
    return apiOk({ deleted }, { headers: NO_CACHE_HEADERS });
  }, "DELETE /api/progress/[mediaId]");
}
