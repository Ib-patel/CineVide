"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { CatalogCategory } from "@/types";

interface CategoryFilterProps {
  categories: CatalogCategory[];
  activeCategory: CatalogCategory;
  onSelect: (category: CatalogCategory) => void;
}

export function CategoryFilter({ categories, activeCategory, onSelect }: CategoryFilterProps) {
  // Scope the shared-layout id so two filters on one page never trade pills.
  const pillId = `category-pill-${useId()}`;

  return (
    <div
      role="tablist"
      aria-label="Browse categories"
      className="-mx-4 flex snap-x items-center gap-1.5 overflow-x-auto px-4 py-1 no-scrollbar md:mx-0 md:px-0"
    >
      {categories.map((category) => {
        const isActive = category === activeCategory;
        return (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(category)}
            className={cn(
              "pressable relative shrink-0 cursor-pointer snap-start rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
              isActive ? "text-night" : "text-white/70 hover:bg-white/[0.08] hover:text-ink"
            )}
          >
            {isActive ? (
              // Spatial continuity: the selection slides from the old tab to the new one.
              <motion.span
                layoutId={pillId}
                aria-hidden
                transition={{ type: "spring", duration: 0.38, bounce: 0.14 }}
                className="absolute inset-0 rounded-full bg-white"
              />
            ) : (
              <span aria-hidden className="absolute inset-0 rounded-full border border-white/12" />
            )}
            <span className="relative">{category}</span>
          </button>
        );
      })}
    </div>
  );
}
