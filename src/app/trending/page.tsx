import type { Metadata } from "next";
import { Suspense } from "react";
import { getTrendingTitles } from "@/server/services/catalog";
import { BrowseGrid } from "@/components/media/BrowseGrid";

export const instant = false;

export const metadata: Metadata = {
  title: "Trending",
  description: "The Cinevide catalog top trending titles this week.",
};

async function TrendingContent() {
  const trending = await getTrendingTitles(40);

  return (
    <BrowseGrid
      items={trending}
      title="Trending"
      description="The top trending movies and web series of the week, ranked by real popularity."
    />
  );
}

export default function TrendingPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 pt-28 pb-12 sm:px-6 lg:px-8">
          <div className="skeleton mb-4 h-10 w-48 rounded-xl" />
          <div className="skeleton mb-8 h-5 w-96 rounded-lg" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="skeleton aspect-[2/3] w-full rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <TrendingContent />
    </Suspense>
  );
}

