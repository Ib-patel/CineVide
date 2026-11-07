"use client";

import { BrowseGrid } from "@/components/media/BrowseGrid";
import { useWatchlist } from "@/context/WatchlistContext";

export default function MyListPage() {
  const { hydrated, watchlistItems } = useWatchlist();

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-[1920px] px-4 pt-32 pb-16 md:px-10">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-white/10" />
        <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-white/5" />
      </div>
    );
  }

  return (
    <BrowseGrid
      items={watchlistItems}
      title="My List"
      description="Titles you've saved with the + button, kept on this device."
      emptyMessage="Your list is empty"
    />
  );
}
