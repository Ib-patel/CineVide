"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Bookmark, Clapperboard, Flame, Home, Tv } from "lucide-react";
import { useWatchlist } from "@/context/WatchlistContext";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Home", href: "/", Icon: Home },
  { label: "Movies", href: "/movies", Icon: Clapperboard },
  { label: "Series", href: "/series", Icon: Tv },
  { label: "Trending", href: "/trending", Icon: Flame },
  { label: "My List", href: "/my-list", Icon: Bookmark },
] as const;

/** Thumb-reach navigation for phones; the header keeps search and profile. */
export function MobileTabBar() {
  const pathname = usePathname();
  const { hydrated, watchlistItems } = useWatchlist();

  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.07] bg-night/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 md:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-5">
        {TABS.map(({ label, href, Icon }) => {
          const active = pathname === href;
          const count = href === "/my-list" && hydrated ? watchlistItems.length : 0;
          return (
            <li key={href} className="flex">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "pressable relative flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 text-[10px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset",
                  active ? "text-ink" : "text-white/55"
                )}
              >
                <span className="relative inline-flex h-7 w-12 items-center justify-center">
                  {active ? (
                    <motion.span
                      layoutId="mobile-tab-pill"
                      aria-hidden
                      transition={{ type: "spring", duration: 0.38, bounce: 0.15 }}
                      className="absolute inset-0 rounded-full bg-white/[0.12]"
                    />
                  ) : null}
                  <Icon className={cn("relative size-[18px]", active && "fill-white/15")} aria-hidden />
                  {count > 0 ? (
                    <span className="absolute -top-0.5 right-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] leading-4 font-bold text-night">
                      {count}
                    </span>
                  ) : null}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
