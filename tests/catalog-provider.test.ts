import { describe, it, expect } from "vitest";
import { prisma } from "@/server/db";
import { tmdbProvider } from "@/server/catalog/tmdb";
import { syncCatalog, syncSingleTitle } from "@/server/catalog/sync";

describe("Catalog Provider & Synchronization", () => {
  it("queries real movie and series metadata from TMDB provider", async () => {
    const movie = await tmdbProvider.getMovieDetails("27205");
    expect(movie).not.toBeNull();
    expect(movie?.title).toBe("Inception");
    expect(movie?.director).toBe("Christopher Nolan");
    expect(movie?.metadataAttribution).toContain("TMDB");

    const series = await tmdbProvider.getSeriesDetails("95557");
    expect(series).not.toBeNull();
    expect(series?.title).toBe("Severance");
    expect(series?.seasons).toBeDefined();
    expect(series?.seasons?.[0].episodes.length).toBeGreaterThan(0);
  });

  it("synchronizes provider metadata into database while preserving editorial flags", async () => {
    // Pick an existing item from DB that has editorial ranking
    const before = await prisma.media.findUnique({
      where: { slug: "neon-parallax" },
    });
    expect(before).not.toBeNull();
    const originalRank = before?.trendingRank;

    // Sync a provider title
    const movie = await tmdbProvider.getMovieDetails("27205");
    expect(movie).not.toBeNull();

    await syncSingleTitle(movie!);

    const after = await prisma.media.findUnique({
      where: { slug: "inception-2010" },
    });

    expect(after).not.toBeNull();
    expect(after?.externalSource).toBe("tmdb");
    expect(after?.externalId).toBe("27205");
    expect(after?.metadataAttribution).toContain("TMDB");
    // Since Inception had no licensed playback asset, availability must be METADATA_ONLY
    expect(after?.availability).toBe("METADATA_ONLY");

    // Existing editorial rank must remain untampered
    const neonAfter = await prisma.media.findUnique({
      where: { slug: "neon-parallax" },
    });
    expect(neonAfter?.trendingRank).toBe(originalRank);
  });

  it("runs full catalog synchronization idempotently", async () => {
    const res = await syncCatalog(tmdbProvider, { limit: 3 });
    expect(res.failed).toBe(0);
    expect(res.inserted + res.updated).toBe(3);
  });
});
