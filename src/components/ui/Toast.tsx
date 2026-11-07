"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export interface ToastData {
  id: number;
  message: string;
}

export function Toast({ message }: { message: string }) {
  return (
    <motion.div
      // Enters and leaves from the same edge (spatial consistency); exit is quicker.
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.32, ease: [0.23, 1, 0.32, 1] } }}
      exit={{ opacity: 0, y: 16, scale: 0.97, transition: { duration: 0.16, ease: "easeOut" } }}
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[120] md:bottom-6 mx-auto flex w-fit max-w-[calc(100vw-2rem)] items-center gap-2.5 rounded-full border border-white/10 bg-elevated/95 px-4 py-2.5 text-sm text-ink shadow-xl backdrop-blur-md"
    >
      <CheckCircle2 className="size-4 shrink-0 text-emerald-400" aria-hidden />
      <span>{message}</span>
    </motion.div>
  );
}
