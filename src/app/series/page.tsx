import type { Metadata } from "next";
import { Suspense } from "react";
import { listSeries } from "@/server/services/catalog";
import { BrowseGrid } from "@/components/media/BrowseGrid";

export const instant = false;

export const metadata: Metadata = {
  title: "Series",
  description: "Browse every web series in the Cinevide catalog.",
};

async function SeriesContent() {
  const shows = await listSeries();

  return (
    <BrowseGrid
      items={shows}
      title="Series"
      description="Complete seasons, episode by episode. Every series here streams in full."
    />
  );
}

export default function SeriesPage() {
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
      <SeriesContent />
    </Suspense>
  );
}

