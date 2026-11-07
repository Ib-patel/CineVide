import { describe, it, expect } from "vitest";
import {
  dedupeMedia,
  extractIdFromSlug,
  listMovies,
  listSeries,
  getTrendingTitles,
} from "@/server/services/catalog";

describe("Catalog Service (Stateless TMDB Proxy)", () => {
  it("extracts TMDB numeric ID and slug name accurately", () => {
    expect(extractIdFromSlug("spider-man-1423191")).toEqual({ id: 1423191 });
    expect(extractIdFromSlug("series-stranger-things-66732")).toEqual({ id: 66732 });
    expect(extractIdFromSlug("unknown-slug")).toEqual({ id: null });
  });

  it("lists movies from live proxy", async () => {
    const movies = await listMovies(4);
    expect(movies.length).toBeGreaterThanOrEqual(1);
    expect(movies[0].type).toBe("movie");
    expect(movies[0].posterUrl).toBeTruthy();
  });

  it("lists series from live proxy", async () => {
    const series = await listSeries(4);
    expect(series.length).toBeGreaterThanOrEqual(1);
    expect(series[0].type).toBe("series");
    expect(series[0].posterUrl).toBeTruthy();
  });

  it("fetches trending titles", async () => {
    const trending = await getTrendingTitles(5);
    expect(trending.length).toBeGreaterThanOrEqual(1);
    expect(trending[0].title).toBeTruthy();
  });

  it("deduplicates media arrays by unique ID", () => {
    const input = [
      { id: "101", title: "Film A" },
      { id: "102", title: "Film B" },
      { id: "101", title: "Film A duplicate" },
    ];
    const deduped = dedupeMedia(input);
    expect(deduped).toHaveLength(2);
    expect(deduped.map((d) => d.id)).toEqual(["101", "102"]);
  });
});
