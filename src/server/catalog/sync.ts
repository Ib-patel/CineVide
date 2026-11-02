import "server-only";
import { prisma } from "@/server/db";
import { logger } from "@/server/lib/logger";
import type { CatalogProvider, ProviderMediaItem } from "@/server/catalog/provider";
import type { Availability } from "@/types";

export interface SyncResult {
  inserted: number;
  updated: number;
  failed: number;
  errors: string[];
}

export async function syncSingleTitle(item: ProviderMediaItem): Promise<"inserted" | "updated"> {
  const existing = await prisma.media.findFirst({
    where: {
      OR: [
        { externalSource: item.externalSource, externalId: item.externalId },
        { slug: item.slug },
      ],
    },
    include: {
      playbackAssets: {
        where: { status: "ACTIVE" },
      },
    },
  });

  // Determine availability based on real rights/licensing:
  // If active licensed playback asset exists -> AVAILABLE.
  // Otherwise -> METADATA_ONLY (browsable, real data, but clearly labeled as not streamable).
  const hasActiveAsset = Boolean(existing && existing.playbackAssets.length > 0);
  const calculatedAvailability: Availability = hasActiveAsset ? "AVAILABLE" : "METADATA_ONLY";

  if (existing) {
    // PRESERVE EDITORIAL FIELDS: do NOT overwrite trendingRank, popularity, isFeatured, featuredOrder, isExclusive
    await prisma.media.update({
      where: { id: existing.id },
      data: {
        title: item.title,
        tagline: item.tagline,
        synopsis: item.synopsis,
        posterUrl: item.posterUrl,
        backdropUrl: item.backdropUrl,
        releaseYear: item.releaseYear,
        rating: item.rating,
        runtimeMinutes: item.runtimeMinutes,
        ageRating: item.ageRating,
        maxResolution: item.maxResolution,
        audioFormats: JSON.stringify(item.audioFormats),
        subtitleLanguages: JSON.stringify(item.subtitleLanguages),
        castJson: JSON.stringify(item.cast),
        director: item.director,
        matchPercent: item.matchPercent,
        externalSource: item.externalSource,
        externalId: item.externalId,
        imdbId: item.imdbId,
        metadataAttribution: item.metadataAttribution,
        syncedAt: new Date(),
        // Only adjust availability if not manually set to coming soon
        availability: existing.availability === "COMING_SOON" ? "COMING_SOON" : calculatedAvailability,
      },
    });

    // Update genres join table
    await prisma.mediaGenre.deleteMany({ where: { mediaId: existing.id } });
    await prisma.mediaGenre.createMany({
      data: item.genres.map((genre) => ({ mediaId: existing.id, genre })),
      skipDuplicates: true,
    });

    return "updated";
  }

  // Insert new media record
  const media = await prisma.media.create({
    data: {
      slug: item.slug,
      title: item.title,
      tagline: item.tagline,
      synopsis: item.synopsis,
      type: item.type === "movie" ? "MOVIE" : "SERIES",
      posterUrl: item.posterUrl,
      backdropUrl: item.backdropUrl,
      releaseYear: item.releaseYear,
      rating: item.rating,
      runtimeMinutes: item.runtimeMinutes,
      ageRating: item.ageRating,
      maxResolution: item.maxResolution,
      audioFormats: JSON.stringify(item.audioFormats),
      subtitleLanguages: JSON.stringify(item.subtitleLanguages),
      castJson: JSON.stringify(item.cast),
      director: item.director,
      matchPercent: item.matchPercent,
      isExclusive: false,
      availability: calculatedAvailability,
      externalSource: item.externalSource,
      externalId: item.externalId,
      imdbId: item.imdbId,
      metadataAttribution: item.metadataAttribution,
      syncedAt: new Date(),
      genres: {
        create: item.genres.map((genre) => ({ genre })),
      },
    },
  });

  // If series, create seasons and episodes
  if (item.type === "series" && item.seasons) {
    for (const s of item.seasons) {
      await prisma.season.create({
        data: {
          id: `${media.id}-s${s.seasonNumber}`,
          mediaId: media.id,
          seasonNumber: s.seasonNumber,
          title: s.title,
          episodes: {
            create: s.episodes.map((ep) => ({
              id: `${media.id}-s${s.seasonNumber}e${ep.episodeNumber}`,
              episodeNumber: ep.episodeNumber,
              title: ep.title,
              description: ep.description,
              durationMinutes: ep.durationMinutes,
              thumbnailUrl: ep.thumbnailUrl,
            })),
          },
        },
      });
    }
  }

  return "inserted";
}

export async function syncCatalog(
  provider: CatalogProvider,
  options?: { limit?: number; type?: "movie" | "series" }
): Promise<SyncResult> {
  const result: SyncResult = {
    inserted: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };

  try {
    const items = await provider.getTrending(options?.type);
    const slice = options?.limit ? items.slice(0, options.limit) : items;

    for (const item of slice) {
      try {
        const action = await syncSingleTitle(item);
        if (action === "inserted") result.inserted += 1;
        else result.updated += 1;
      } catch (error) {
        result.failed += 1;
        const msg = `Failed to sync title ${item.title}: ${error instanceof Error ? error.message : String(error)}`;
        result.errors.push(msg);
        logger.error(msg, "syncCatalog", { externalId: item.externalId }, error);
      }
    }
  } catch (error) {
    const msg = `Provider ${provider.name} failed during sync: ${error instanceof Error ? error.message : String(error)}`;
    result.errors.push(msg);
    logger.error(msg, "syncCatalog", undefined, error);
  }

  logger.info("Catalog sync completed", "syncCatalog", result);
  return result;
}
