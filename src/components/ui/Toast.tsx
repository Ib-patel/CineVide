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
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-6 z-[120] mx-auto flex w-fit max-w-[calc(100vw-2rem)] items-center gap-2.5 rounded-full border border-white/10 bg-elevated/95 px-4 py-2.5 text-sm text-ink shadow-xl backdrop-blur-md"
    >
      <CheckCircle2 className="size-4 shrink-0 text-gold" aria-hidden />
      <span>{message}</span>
    </motion.div>
  );
}
