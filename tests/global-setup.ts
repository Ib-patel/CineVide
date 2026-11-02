import { PrismaClient } from "@prisma/client";
import {
  catalog,
  trendingOrder,
  popularMovieOrder,
  bingeWorthySeriesOrder,
  exclusiveOrder,
  featuredItems,
} from "../src/data/mock/catalog";

export default async function globalSetup() {
  const dbUrl =
    process.env.TEST_DATABASE_URL ||
    "postgresql://cinevide:cinevide_dev@localhost:54322/cinevide_test";

  process.env.DATABASE_URL = dbUrl;
  process.env.AUTH_SESSION_COOKIE = "cinevide_session";
  process.env.AUTH_SESSION_TTL_DAYS = "30";
  process.env.AUTH_SESSION_SECURE = "false";
  process.env.PLAYBACK_TOKEN_SECRET = "test-playback-secret-1234567890123456";

  const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } },
  });

  try {
    // Reset test database
    await prisma.playbackAsset.deleteMany();
    await prisma.watchProgress.deleteMany();
    await prisma.watchlistItem.deleteMany();
    await prisma.session.deleteMany();
    await prisma.episode.deleteMany();
    await prisma.season.deleteMany();
    await prisma.mediaGenre.deleteMany();
    await prisma.media.deleteMany();
    await prisma.user.deleteMany();

    // Seed catalog items
    for (const item of catalog) {
      const trendingIndex = trendingOrder.indexOf(item.id);
      const trendingRank = trendingIndex !== -1 ? trendingIndex + 1 : null;

      let popularity: number | null = null;
      if (item.type === "movie") {
        const popIdx = popularMovieOrder.indexOf(item.id);
        if (popIdx !== -1) popularity = popIdx + 1;
      } else {
        const popIdx = bingeWorthySeriesOrder.indexOf(item.id);
        if (popIdx !== -1) popularity = popIdx + 1;
      }

      const featuredIdx = featuredItems.findIndex((f) => f.mediaId === item.id);
      const isFeatured = featuredIdx !== -1;
      const featuredOrder = isFeatured ? featuredIdx + 1 : null;
      const isExclusive = Boolean(item.isExclusive || exclusiveOrder.includes(item.id));
      const demoPreviewUrl = item.demoPreviewUrl || "/videos/demo/demo-preview.mp4";

      const media = await prisma.media.create({
        data: {
          id: item.id,
          slug: item.id,
          title: item.title,
          tagline: item.tagline || null,
          synopsis: item.synopsis,
          type: item.type === "movie" ? "MOVIE" : "SERIES",
          posterUrl: item.posterUrl,
          backdropUrl: item.backdropUrl,
          releaseYear: item.releaseYear,
          rating: item.rating,
          runtimeMinutes: item.type === "movie" ? item.runtimeMinutes : null,
          ageRating: item.ageRating,
          maxResolution: item.maxResolution,
          audioFormats: JSON.stringify(item.audioFormats || []),
          subtitleLanguages: JSON.stringify(item.subtitleLanguages || []),
          castJson: JSON.stringify(item.cast || []),
          director: item.director,
          matchPercent: item.matchPercent,
          isExclusive,
          availability: "AVAILABLE",
          trendingRank,
          popularity,
          isFeatured,
          featuredOrder,
          demoPreviewUrl,
          genres: {
            create: item.genres.map((g) => ({ genre: g })),
          },
        },
      });

      if (item.type === "series" && "seasons" in item && Array.isArray(item.seasons)) {
        for (const s of item.seasons) {
          await prisma.season.create({
            data: {
              id: `${media.id}-s${s.seasonNumber}`,
              mediaId: media.id,
              seasonNumber: s.seasonNumber,
              title: s.title,
              episodes: {
                create: s.episodes.map((ep) => ({
                  id: ep.id,
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
    }

    // Create an active licensed PlaybackAsset for testing
    await prisma.playbackAsset.create({
      data: {
        mediaId: "neon-parallax",
        playbackProvider: "hls",
        streamUrl: "https://test-cdn.cinevide.local/live/neon-parallax/master.m3u8",
        status: "ACTIVE",
        allowedRegions: JSON.stringify(["GLOBAL", "US", "IN"]),
      },
    });

    // Create a metadata-only title for testing availability gating
    await prisma.media.create({
      data: {
        id: "metadata-only-title",
        slug: "metadata-only-title",
        title: "Metadata Only Title",
        synopsis: "Title with metadata but no streaming license.",
        type: "MOVIE",
        posterUrl: "https://picsum.photos/seed/meta/480/720",
        backdropUrl: "https://picsum.photos/seed/meta-bg/1920/1080",
        releaseYear: 2026,
        rating: 7.5,
        ageRating: "PG-13",
        maxResolution: "HD",
        director: "Unknown",
        matchPercent: 80,
        availability: "METADATA_ONLY",
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}
