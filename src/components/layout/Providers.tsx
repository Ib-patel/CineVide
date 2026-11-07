"use client";

import type { ReactNode } from "react";
import { WatchlistProvider } from "@/context/WatchlistContext";
import { ModalProvider } from "@/context/ModalContext";
import { ToastProvider } from "@/context/ToastContext";
import { ContentDetailModal } from "@/components/modal/ContentDetailModal";
import { HoverPreviewProvider } from "@/context/HoverPreviewContext";
import { SearchProvider } from "@/context/SearchContext";
import { MotionConfig } from "framer-motion";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <WatchlistProvider>
        <ModalProvider>
          <SearchProvider>
            {/* reducedMotion="user": every Framer animation honours the OS setting. */}
            <MotionConfig reducedMotion="user">
              <HoverPreviewProvider>
                {children}
                <ContentDetailModal />
              </HoverPreviewProvider>
            </MotionConfig>
          </SearchProvider>
        </ModalProvider>
      </WatchlistProvider>
    </ToastProvider>
  );
}
