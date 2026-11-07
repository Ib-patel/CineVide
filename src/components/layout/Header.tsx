"use client";

import { Logo } from "@/components/ui/Logo";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Menu, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { MediaSummary } from "@/types";
import { apiGet } from "@/lib/api-client";
import { useSearch } from "@/context/SearchContext";
import { useModal } from "@/context/ModalContext";
import { useWatchlist } from "@/context/WatchlistContext";
import { cn, formatCardMeta } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Movies", href: "/movies" },
  { label: "Series", href: "/series" },
  { label: "Trending", href: "/trending" },
  { label: "My List", href: "/my-list" },
];

const NOTIFICATIONS_SEEN_KEY = "cinevide:new-titles-seen-at";

/** "3h ago", "2d ago" — relative to now, for the New on Cinevide list. */
function timeAgo(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return minutes <= 1 ? "Just added" : `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days < 30 ? `${days}d ago` : new Date(iso).toLocaleDateString();
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [newTitles, setNewTitles] = useState<(MediaSummary & { addedAt: string })[]>([]);
  const [lastSeenAt, setLastSeenAt] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      return Number(window.localStorage.getItem(NOTIFICATIONS_SEEN_KEY)) || 0;
    } catch {
      return 0;
    }
  });

  const { hydrated, watchlistItems } = useWatchlist();
  const { openDetails } = useModal();
  const { query, setQuery, clear: clearSearch, isSearching } = useSearch();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  // Real "what's new" feed: the latest titles added to the catalog.
  useEffect(() => {
    const controller = new AbortController();
    apiGet<(MediaSummary & { addedAt: string })[]>("/api/catalog/new", controller.signal)
      .then((result) => {
        if (result.ok) setNewTitles(result.data);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const hasUnseen = newTitles.some((t) => new Date(t.addedAt).getTime() > lastSeenAt);
  const markSeen = () => {
    const now = Date.now();
    setLastSeenAt(now);
    try {
      window.localStorage.setItem(NOTIFICATIONS_SEEN_KEY, String(now));
    } catch {
      // storage unavailable (private mode): the dot simply reappears next visit
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // Search is closed from its own input, so Escape on a details popup opened
      // from the results never wipes them.
      setNotificationsOpen(false);
      setMobileOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (headerRef.current?.contains(event.target as Node)) return;
      setNotificationsOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  // Search results live on the home screen; leaving it ends the search.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setMobileOpen(false);
      if (pathname !== "/") {
        setSearchOpen(false);
        clearSearch();
      }
    });
    return () => cancelAnimationFrame(raf);
    // clearSearch is a fresh closure each render; only route changes matter here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Keep the search field open while a search is active (e.g. after a refresh of state).
  const showSearch = searchOpen || isSearching;

  const onQueryChange = (value: string) => {
    setQuery(value);
    if (value.trim().length > 0 && pathname !== "/") router.push("/");
  };

  const closeSearch = () => {
    setSearchOpen(false);
    clearSearch();
  };

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          "fixed inset-x-0 top-0 z-50 bg-origin-border transition-[background-color,border-color,backdrop-filter] duration-300 ease-out",
          scrolled || showSearch
            ? "border-b border-white/[0.07] bg-night/80 backdrop-blur-xl backdrop-saturate-150"
            : "border-b border-transparent bg-gradient-to-b from-night/80 via-night/30 to-transparent"
        )}
      >
        <nav
          aria-label="Primary"
          className="mx-auto flex h-16 max-w-[1920px] items-center gap-4 px-4 md:h-18 md:px-10"
        >
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label="Open navigation menu"
            onClick={() => setMobileOpen(true)}
            className="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg text-ink transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:hidden"
          >
            <Menu className="size-5" aria-hidden />
          </button>

          <Link
            href="/"
            aria-label="Cinevide home"
            className="mr-2 flex shrink-0 cursor-pointer items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Logo size="lg" />
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "relative cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                      isActive ? "text-ink" : "text-muted hover:text-ink"
                    )}
                  >
                    {link.label}
                    {link.href === "/my-list" && hydrated ? (
                      <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-night">
                        {watchlistItems.length}
                      </span>
                    ) : null}
                    {isActive ? (
                      <motion.span
                        layoutId="nav-underline"
                        aria-hidden
                        transition={{ type: "spring", duration: 0.4, bounce: 0.12 }}
                        className="bg-projector absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full"
                      />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="ml-auto flex items-center gap-1 md:gap-2">
            <AnimatePresence>
              {showSearch ? (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "min(21rem, 62vw)", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                  className="relative overflow-hidden"
                >
                  <Search
                    className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted"
                    aria-hidden
                  />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={query}
                    onChange={(event) => onQueryChange(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") closeSearch();
                    }}
                    placeholder="Search movies and series…"
                    aria-label="Search the catalog"
                    className="h-9 w-full rounded-lg border border-white/15 bg-white/5 pl-8 pr-8 text-sm text-ink placeholder:text-subtle focus-visible:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  />
                  {query.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        clearSearch();
                        searchInputRef.current?.focus();
                      }}
                      aria-label="Clear search"
                      className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-subtle hover:text-ink focus-visible:outline-none"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  ) : null}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <button
              type="button"
              aria-expanded={showSearch}
              aria-label={showSearch ? "Close search" : "Open search"}
              onClick={() => (showSearch ? closeSearch() : setSearchOpen(true))}
              className="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg text-ink transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {showSearch ? <X className="size-5" aria-hidden /> : <Search className="size-5" aria-hidden />}
            </button>

            <div className="relative">
              <button
                type="button"
                aria-expanded={notificationsOpen}
                aria-haspopup="menu"
                aria-label={hasUnseen ? "New on Cinevide (new titles)" : "New on Cinevide"}
                onClick={() => {
                  setNotificationsOpen((prev) => !prev);
                              markSeen();
                }}
                className="relative inline-flex size-10 cursor-pointer items-center justify-center rounded-lg text-ink transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Bell className="size-5" aria-hidden />
                {hasUnseen ? (
                  <span aria-hidden className="absolute top-2 right-2 size-2 rounded-full bg-accent" />
                ) : null}
              </button>
              <AnimatePresence>
                {notificationsOpen ? (
                  <motion.div
                    role="menu"
                    aria-label="New on Cinevide"
                    initial={{ opacity: 0, y: -4, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.18, ease: [0.23, 1, 0.32, 1] } }}
                    exit={{ opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.12, ease: "easeOut" } }}
                    style={{ transformOrigin: "top right" }}
                    className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-white/10 bg-elevated/95 shadow-2xl backdrop-blur-xl"
                  >
                    <p className="border-b border-white/10 px-4 py-3 font-display text-sm font-semibold text-ink">
                      New on Cinevide
                    </p>
                    <ul className="max-h-80 overflow-y-auto">
                      {newTitles.length === 0 ? (
                        <li className="px-4 py-6 text-center text-xs text-muted">Nothing new yet.</li>
                      ) : (
                        newTitles.map((title) => (
                          <li key={title.id}>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setNotificationsOpen(false);
                                openDetails(title);
                              }}
                              className="flex w-full cursor-pointer gap-3 px-4 py-3 text-left hover:bg-white/5 focus-visible:bg-white/5 focus-visible:outline-none"
                            >
                              <div className="relative aspect-video w-16 shrink-0 overflow-hidden rounded-md bg-white/5">
                                <SafeImage src={title.backdropUrl} alt="" fill sizes="64px" className="object-cover" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-ink">{title.title}</p>
                                <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                                  {title.type === "series" ? "New series" : "New film"} ·{" "}
                                  {formatCardMeta(title.type, title.releaseYear, title.runtimeMinutes, title.seasonsCount)}
                                </p>
                                <p className="mt-1 text-[10px] text-subtle">{timeAgo(title.addedAt)}</p>
                              </div>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

          </div>
        </nav>

      </header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} onNavigate={router.refresh} />
    </>
  );
}

function MobileNav({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-night/70 backdrop-blur-sm md:hidden"
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.34, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-y-0 left-0 z-[70] flex w-72 max-w-[82vw] flex-col border-r border-white/10 bg-elevated/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <Logo size="md" />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close navigation menu"
                className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-ink transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <nav aria-label="Mobile" className="flex-1 overflow-y-auto p-3">
              <ul className="space-y-1">
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        aria-current={isActive ? "page" : undefined}
                        onClick={() => {
                          onClose();
                          onNavigate?.();
                        }}
                        className={cn(
                          "block cursor-pointer rounded-lg px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                          isActive
                            ? "bg-white/10 text-ink"
                            : "text-muted hover:bg-white/5 hover:text-ink"
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <p className="border-t border-white/10 px-4 py-3 text-[11px] text-subtle">
              All catalog data is fictional demo content.
            </p>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
