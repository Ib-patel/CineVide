import type { Metadata } from "next";
import { Suspense } from "react";
import { listMovies } from "@/server/services/catalog";
import { BrowseGrid } from "@/components/media/BrowseGrid";

export const instant = false;

export const metadata: Metadata = {
  title: "Movies",
  description: "Browse every feature film in the Cinevide catalog.",
};

async function MoviesContent() {
  const movies = await listMovies();

  return (
    <BrowseGrid
      items={movies}
      title="Movies"
      description="Every feature film you can stream on Cinevide, highest rated first."
    />
  );
}

export default function MoviesPage() {
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
      <MoviesContent />
    </Suspense>
  );
}

