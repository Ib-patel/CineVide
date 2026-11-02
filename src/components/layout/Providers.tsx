"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { WatchlistProvider } from "@/context/WatchlistContext";
import { ModalProvider } from "@/context/ModalContext";
import { ToastProvider } from "@/context/ToastContext";
import { ContentDetailModal } from "@/components/modal/ContentDetailModal";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <WatchlistProvider>
          <ModalProvider>
            {children}
            <ContentDetailModal />
          </ModalProvider>
        </WatchlistProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
