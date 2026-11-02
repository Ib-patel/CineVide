import type { Metadata } from "next";
import { listSeries } from "@/server/services/catalog";
import { BrowseGrid } from "@/components/media/BrowseGrid";

export const metadata: Metadata = {
  title: "Series",
  description: "Browse every web series in the Cinevide catalog.",
};

export default async function SeriesPage() {
  const shows = await listSeries();

  return (
    <BrowseGrid
      items={shows}
      title="Series"
      description="Every web series in the Cinevide catalog, sorted by rating. Fictional mock data — no real titles are represented."
    />
  );
}

