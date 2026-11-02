"use client";

import type { MediaSummary } from "@/types";
import { MediaCard } from "@/components/media/MediaCard";

interface BrowseGridProps {
  items: MediaSummary[];
  title: string;
  description: string;
  emptyMessage?: string;
}

export function BrowseGrid({ items, title, description, emptyMessage }: BrowseGridProps) {
  return (
    <section className="mx-auto w-full max-w-[1920px] px-4 pt-28 pb-16 md:px-10 md:pt-32">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted md:text-base">{description}</p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-card px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold text-ink">
            {emptyMessage ?? "Nothing here yet"}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            {emptyMessage
              ? "Use the + button on any card to save it to My List"
              : "Try a different filter or search from the header."}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
          {items.map((item) => (
            <li key={item.id}>
              <MediaCard
                item={item}
                className="w-full"
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
