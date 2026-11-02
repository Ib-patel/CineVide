import { describe, it, expect } from "vitest";
import {
  listCatalog,
  listMovies,
  listSeries,
  searchCatalog,
  getTrendingTitles,
  getPopularTitles,
  getBingeWorthySeries,
  getExclusives,
  getTopRated,
  getMediaBySlug,
  getFeaturedTitles,
} from "@/server/services/catalog";

describe("Catalog Service", () => {
  it("lists all available items with pagination", async () => {
    const page1 = await listCatalog({ limit: 10 });
    expect(page1.data).toHaveLength(10);
    expect(page1.total).toBeGreaterThanOrEqual(26);
    expect(page1.nextCursor).toBe(10);

    const page2 = await listCatalog({ cursor: page1.nextCursor!, limit: 10 });
    expect(page2.data).toHaveLength(10);
    expect(page2.nextCursor).toBe(20);

    const page3 = await listCatalog({ cursor: page2.nextCursor!, limit: 10 });
    expect(page3.data).toHaveLength(6);
    expect(page3.nextCursor).toBeNull();
  });

  it("filters catalog by type and genre", async () => {
    const movies = await listMovies(50);
    expect(movies.length).toBeGreaterThan(0);
    expect(movies.every((m) => m.type === "movie")).toBe(true);

    const series = await listSeries(50);
    expect(series.length).toBeGreaterThan(0);
    expect(series.every((s) => s.type === "series")).toBe(true);

    const sciFi = await listCatalog({ genre: "Sci-Fi" });
    expect(sciFi.data.length).toBeGreaterThan(0);
    expect(sciFi.data.every((item) => item.genres.includes("Sci-Fi"))).toBe(true);
  });

  it("searches catalog by text match", async () => {
    const results = await searchCatalog("neon");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((item) => item.title.toLowerCase().includes("neon"))).toBe(true);
  });

  it("returns curated rows in correct order", async () => {
    const trending = await getTrendingTitles(10);
    expect(trending.length).toBe(10);

    const popular = await getPopularTitles(10);
    expect(popular.length).toBeGreaterThan(0);
    expect(popular.every((m) => m.type === "movie")).toBe(true);

    const binge = await getBingeWorthySeries(10);
    expect(binge.length).toBeGreaterThan(0);
    expect(binge.every((s) => s.type === "series")).toBe(true);

    const exclusives = await getExclusives(10);
    expect(exclusives.length).toBeGreaterThan(0);
    expect(exclusives.every((e) => e.isExclusive)).toBe(true);

    const topRated = await getTopRated(5);
    expect(topRated.length).toBe(5);
    for (let i = 1; i < topRated.length; i++) {
      expect(topRated[i - 1].rating).toBeGreaterThanOrEqual(topRated[i].rating);
    }
  });

  it("fetches full media details by slug including seasons and episodes", async () => {
    const detail = await getMediaBySlug("aetherbound");
    expect(detail).not.toBeNull();
    expect(detail?.slug).toBe("aetherbound");
    expect(detail?.type).toBe("series");
    if (detail && detail.type === "series") {
      expect(detail.seasons.length).toBeGreaterThan(0);
      expect(detail.seasons[0].episodes.length).toBeGreaterThan(0);
    }
  });

  it("returns featured items with preview video urls", async () => {
    const featured = await getFeaturedTitles();
    expect(featured.length).toBe(3);
    expect(featured[0].media.title).toBeDefined();
    expect(featured[0].previewVideoUrl).toBe("/videos/demo/demo-preview.mp4");
  });
});
