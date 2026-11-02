import type { Metadata } from "next";
import { getTrendingTitles } from "@/server/services/catalog";
import { BrowseGrid } from "@/components/media/BrowseGrid";

export const metadata: Metadata = {
  title: "Trending",
  description: "The Cinevide catalog top trending titles this week.",
};

export default async function TrendingPage() {
  const trending = await getTrendingTitles();

  return (
    <BrowseGrid
      items={trending}
      title="Trending"
      description="The ten titles trending across Cinevide this week, in order. Fictional mock data."
    />
  );
}

