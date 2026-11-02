import { NextRequest } from "next/server";
import { handleRoute, apiOk, apiError } from "@/server/http";
import { getMediaBySlug } from "@/server/services/catalog";

export async function GET(
  _request: NextRequest,
  segmentData: { params: Promise<{ slug: string }> }
) {
  return handleRoute(async () => {
    const { slug } = await segmentData.params;
    const media = await getMediaBySlug(slug);
    if (!media) {
      return apiError(404, "NOT_FOUND", `Media with slug "${slug}" was not found.`);
    }
    return apiOk(media);
  }, "GET /api/catalog/media/[slug]");
}

