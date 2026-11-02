import type { Metadata } from "next";
import { listMovies } from "@/server/services/catalog";
import { BrowseGrid } from "@/components/media/BrowseGrid";

export const metadata: Metadata = {
  title: "Movies",
  description: "Browse every feature film in the Cinevide catalog.",
};

export default async function MoviesPage() {
  const movies = await listMovies();

  return (
    <BrowseGrid
      items={movies}
      title="Movies"
      description="Every feature film in the Cinevide catalog, sorted by rating. Fictional mock data — no real titles are represented."
    />
  );
}

