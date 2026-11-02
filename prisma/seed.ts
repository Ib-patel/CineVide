import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import {
  catalog,
  trendingOrder,
  popularMovieOrder,
  bingeWorthySeriesOrder,
  exclusiveOrder,
  featuredItems,
  continueWatching,
} from "../src/data/mock/catalog";

const scryptAsync = promisify(scrypt);
const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

async function main() {
  console.log("Seeding Cinevide database...");

  // Clean existing data in reverse FK order
  await prisma.playbackAsset.deleteMany();
  await prisma.watchProgress.deleteMany();
  await prisma.watchlistItem.deleteMany();
  await prisma.session.deleteMany();
  await prisma.episode.deleteMany();
  await prisma.season.deleteMany();
  await prisma.mediaGenre.deleteMany();
  await prisma.media.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  const passwordHash = await hashPassword("Password123!");
  const demoUser = await prisma.user.create({
    data: {
      email: "demo@cinevide.local",
      name: "Ishan",
      passwordHash,
    },
  });
  console.log(`Created demo user: ${demoUser.email} (Password: Password123!)`);

  // Insert catalog items
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

  console.log(`Inserted ${catalog.length} catalog items.`);

  // Seed watchlist for demo user
  const demoWatchlistSlugs = ["neon-parallax", "aetherbound", "paper-samurai"];
  for (const slug of demoWatchlistSlugs) {
    const m = await prisma.media.findUnique({ where: { slug } });
    if (m) {
      await prisma.watchlistItem.create({
        data: {
          userId: demoUser.id,
          mediaId: m.id,
        },
      });
    }
  }

  // Seed watch progress for demo user from continueWatching
  for (const cw of continueWatching) {
    const m = await prisma.media.findUnique({ where: { slug: cw.mediaId } });
    if (!m) continue;

    let episodeId: string | null = null;
    if (cw.episode) {
      const ep = await prisma.episode.findFirst({
        where: {
          season: { mediaId: m.id, seasonNumber: cw.episode.seasonNumber },
          episodeNumber: cw.episode.episodeNumber,
        },
      });
      if (ep) episodeId = ep.id;
    }

    await prisma.watchProgress.create({
      data: {
        userId: demoUser.id,
        mediaId: m.id,
        episodeId,
        positionSeconds: cw.progressSeconds,
        durationSeconds: cw.durationSeconds,
        completed: cw.progressSeconds / cw.durationSeconds >= 0.95,
      },
    });
  }

  console.log("Seeded demo user watchlist and watch progress.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
