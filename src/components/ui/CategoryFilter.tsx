"use client";

import { cn } from "@/lib/utils";
import type { CatalogCategory } from "@/types";

interface CategoryFilterProps {
  categories: CatalogCategory[];
  activeCategory: CatalogCategory;
  onSelect: (category: CatalogCategory) => void;
}

export function CategoryFilter({ categories, activeCategory, onSelect }: CategoryFilterProps) {
  return (
    <div
      role="tablist"
      aria-label="Browse categories"
      className="flex items-center gap-2 overflow-x-auto no-scrollbar"
    >
      {categories.map((category) => {
        const isActive = category === activeCategory;
        return (
          <button
            key={category}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(category)}
            className={cn(
              "cursor-pointer whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
              isActive
                ? "border-white bg-ink font-semibold text-night"
                : "border-white/15 bg-white/5 text-muted hover:border-white/35 hover:text-ink"
            )}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
