"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaRowProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

const EDGE_FADE = "56px";

export function MediaRow({ title, subtitle, children }: MediaRowProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [visible, setVisible] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const observer = new ResizeObserver(updateArrows);
    if (scrollerRef.current) observer.observe(scrollerRef.current);
    return () => observer.disconnect();
  }, [updateArrows, children]);

  // One-time reveal as the row approaches the viewport (it never re-animates on scroll back).
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -60px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const scrollByPage = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    // Scroll-snap settles the final position on a card edge.
    el.scrollBy({ left: direction * el.clientWidth * 0.86, behavior: "smooth" });
  };

  // Soft edges only where more content exists, so the row never looks cut off at rest.
  const mask = `linear-gradient(90deg, ${atStart ? "#000" : "transparent"} 0, #000 ${EDGE_FADE}, #000 calc(100% - ${EDGE_FADE}), ${atEnd ? "#000" : "transparent"} 100%)`;

  return (
    <section
      ref={sectionRef}
      data-visible={visible}
      className="row-reveal group/row relative py-4 md:py-5"
      aria-label={title}
    >
      <div className="mb-3 flex items-baseline gap-3 px-4 md:px-10">
        <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-ink md:text-[1.35rem]">
          {title}
        </h2>
        {subtitle ? <p className="text-xs text-subtle">{subtitle}</p> : null}
      </div>

      <div className="relative">
        <div
          ref={scrollerRef}
          onScroll={updateArrows}
          style={{ maskImage: mask, WebkitMaskImage: mask }}
          className="flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain -mt-2 px-4 pt-3 pb-6 no-scrollbar md:scroll-px-10 md:gap-4 md:px-10"
        >
          {children}
        </div>

        <RowArrow direction="left" hidden={atStart} onClick={() => scrollByPage(-1)} />
        <RowArrow direction="right" hidden={atEnd} onClick={() => scrollByPage(1)} />
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
      tabIndex={hidden ? -1 : 0}
      aria-hidden={hidden}
      aria-label={direction === "left" ? "Scroll row left" : "Scroll row right"}
      className={cn(
        "pressable absolute top-[calc(50%-12px)] z-30 hidden size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-night/80 text-ink shadow-xl backdrop-blur-md hover:border-white/40 hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:flex",
        direction === "left" ? "left-3" : "right-3",
        hidden
          ? "pointer-events-none opacity-0"
          : "opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100"
      )}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}
