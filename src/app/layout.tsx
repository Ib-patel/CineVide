import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Cinevide — Cinematic Movie & Series Streaming (Phase 1 Demo)",
    template: "%s · Cinevide",
  },
  description:
    "Cinevide is a premium cinematic streaming frontend demo built with Next.js, TypeScript, and Tailwind CSS. All catalog content is fictional mock data — Phase 1 frontend only.",
};

export const viewport: Viewport = {
  themeColor: "#07070A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-night font-sans text-ink">
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:inline-flex focus:h-10 focus:items-center focus:rounded-lg focus:bg-ink focus:px-4 focus:text-sm focus:font-semibold focus:text-night"
          >
            Skip to content
          </a>
          <Header />
          <main id="main-content" className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
