import type { CatalogCategory, MediaSummary } from "@/types";

export function filterCatalogByCategory(
  items: MediaSummary[],
  category: CatalogCategory
): MediaSummary[] {
  if (category === "All") return items;
  if (category === "Movies") return items.filter((item) => item.type === "movie");
  if (category === "Series") return items.filter((item) => item.type === "series");
  return items.filter((item) => item.genres.includes(category));
}

export const topRatedItems = {
  sort(items: MediaSummary[]): MediaSummary[] {
    return [...items].sort((a, b) => b.rating - a.rating);
  },
};
