import type { Metadata, Viewport } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { IntroSplash, INTRO_GATE_SCRIPT } from "@/components/layout/IntroSplash";

// Sora: titles and display type. Manrope: interface and reading text.
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

// A static (non-variable) Sora cut for the outlined Top 10 numerals: variable
// fonts keep overlapping contours, which show as stray lines under a text stroke.
const soraRank = Sora({
  subsets: ["latin"],
  weight: "800",
  variable: "--font-sora-rank",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Cinevide — Cinematic Movies & Series",
    template: "%s · Cinevide",
  },
  description:
    "Stream cinematic films and binge-worthy series on Cinevide — curated originals, trending titles, and picks made for you.",
};

export const viewport: Viewport = {
  themeColor: "#08080A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${soraRank.variable} ${manrope.variable} h-full antialiased`}
      // INTRO_GATE_SCRIPT sets data-intro on <html> before React hydrates.
      suppressHydrationWarning
    >
      <head>
        {/* Must run before first paint so returning visitors never see the intro flash. */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_GATE_SCRIPT }} />
      </head>
      {/* Extensions (e.g. ColorZilla's cz-shortcut-listen) add attributes to <body> before
          React hydrates. This only silences attribute diffs on this element, not its children. */}
      <body suppressHydrationWarning className="flex min-h-full flex-col bg-night font-sans text-ink">
        <IntroSplash />
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:inline-flex focus:h-10 focus:items-center focus:rounded-lg focus:bg-ink focus:px-4 focus:text-sm focus:font-semibold focus:text-night"
          >
            Skip to content
          </a>
          <Header />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          {/* Bottom padding on phones clears the tab bar (and the home indicator). */}
          <div className="pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
            <Footer />
          </div>
          <MobileTabBar />
        </Providers>
      </body>
    </html>
  );
}
