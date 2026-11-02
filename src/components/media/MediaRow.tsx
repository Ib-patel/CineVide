"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaRowProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function MediaRow({ title, subtitle, children }: MediaRowProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    const observer = new ResizeObserver(updateArrows);
    if (scrollerRef.current) observer.observe(scrollerRef.current);
    return () => {
      window.removeEventListener("resize", updateArrows);
      observer.disconnect();
    };
  }, [updateArrows, children]);

  const scrollByAmount = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section className="group/row relative py-5" aria-label={title}>
      <div className="mb-3 flex items-baseline gap-3 px-4 md:px-10">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink md:text-xl">
          {title}
        </h2>
        {subtitle ? <p className="text-xs text-subtle">{subtitle}</p> : null}
      </div>

      <div className="relative">
        <div
          ref={scrollerRef}
          onScroll={updateArrows}
          className="flex gap-3 overflow-x-auto scroll-smooth px-4 pt-1 pb-8 no-scrollbar md:px-10"
        >
          {children}
        </div>

        <RowArrow
          direction="left"
          hidden={atStart}
          onClick={() => scrollByAmount(-1)}
        />
        <RowArrow
          direction="right"
          hidden={atEnd}
          onClick={() => scrollByAmount(1)}
        />
      </div>
    </section>
  );
}

function RowArrow({
  direction,
  hidden,
  onClick,
}: {
  direction: "left" | "right";
  hidden: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "left" ? "Scroll row left" : "Scroll row right"}
      className={cn(
        "absolute top-1/2 z-30 hidden size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-night/85 text-ink backdrop-blur-md transition-opacity duration-200 hover:border-white/40 hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:flex",
        direction === "left" ? "left-2" : "right-2",
        hidden
          ? "pointer-events-none opacity-0"
          : "opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100"
      )}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}
