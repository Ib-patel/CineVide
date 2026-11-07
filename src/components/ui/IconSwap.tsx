"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/**
 * Crossfades two icons with a touch of scale + blur so the swap reads as one
 * morph (e.g. + → ✓ on My List). The blur hides the moment both icons overlap.
 */
export function IconSwap({
  show,
  on,
  off,
  className = "size-5",
}: {
  show: boolean;
  on: ReactNode;
  off: ReactNode;
  /** Sizes the fixed box both icons share, so the button never resizes mid-swap. */
  className?: string;
}) {
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center", className)} aria-hidden>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={show ? "on" : "off"}
          initial={{ opacity: 0, scale: 0.6, filter: "blur(4px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.6, filter: "blur(4px)" }}
          transition={{ duration: 0.18, ease: EASE_OUT }}
          className="inline-flex"
        >
          {show ? on : off}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
