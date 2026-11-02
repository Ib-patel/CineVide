"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, BookmarkCheck, LogIn, Menu, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { MediaSummary } from "@/types";
import { notifications } from "@/data/mock/catalog";
import { catalogApi } from "@/lib/api-client";
import { useModal } from "@/context/ModalContext";
import { useAuth } from "@/context/AuthContext";
import { useWatchlist } from "@/context/WatchlistContext";
import { signOutAction } from "@/app/auth/actions";
import { cn, formatCardMeta, formatRating } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Movies", href: "/movies" },
  { label: "Series", href: "/series" },
  { label: "Trending", href: "/trending" },
  { label: "My List", href: "/my-list" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    state: "idle" | "loading" | "done" | "error";
    items: MediaSummary[];
  }>({ state: "idle", items: [] });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  const { hydrated, watchlistItems } = useWatchlist();
  const { openDetails } = useModal();
  const { user } = useAuth();

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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setSearchOpen(false);
      setNotificationsOpen(false);
      setProfileOpen(false);
      setMobileOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (headerRef.current?.contains(event.target as Node)) return;
      setNotificationsOpen(false);
      setProfileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setMobileOpen(false);
      setSearchOpen(false);
      setQuery("");
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  // Debounced catalog search against the API.
  useEffect(() => {
    const trimmed = query.trim();
    if (!searchOpen || trimmed.length === 0) {
      searchAbortRef.current?.abort();
      searchAbortRef.current = null;
      const raf = requestAnimationFrame(() => {
        setSearchResults({ state: "idle", items: [] });
      });
      return () => cancelAnimationFrame(raf);
    }
    const raf = requestAnimationFrame(() => {
      setSearchResults((prev) => ({ state: "loading", items: prev.items }));
    });
    const timer = window.setTimeout(async () => {
      searchAbortRef.current?.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;
      const items = await catalogApi.search(trimmed, controller.signal);
      if (controller.signal.aborted) return;
      setSearchResults(items === null ? { state: "error", items: [] } : { state: "done", items });
    }, 300);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [query, searchOpen]);

  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;
  const searchLabel = useMemo(() => {
    if (searchResults.state === "loading") return "Searching…";
    if (searchResults.state === "error") return "Search is unavailable right now.";
    if (searchResults.state === "done" && searchResults.items.length === 0) return "";
    return "";
  }, [searchResults]);

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled || searchOpen
            ? "border-b border-white/10 bg-night/85 backdrop-blur-xl"
            : "bg-gradient-to-b from-night/80 via-night/30 to-transparent"
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
            className="mr-2 flex shrink-0 cursor-pointer items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span className="relative inline-flex size-8 items-center justify-center overflow-hidden rounded-lg bg-accent shadow-lg shadow-accent/40">
              <Image src="/images/branding/logo-mark.svg" alt="" width={22} height={22} />
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-ink">
              Cine<span className="text-accent">vide</span>
            </span>
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
                      <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                        {watchlistItems.length}
                      </span>
                    ) : null}
                    {isActive ? (
                      <span aria-hidden className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-accent" />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="ml-auto flex items-center gap-1 md:gap-2">
            <AnimatePresence>
              {searchOpen ? (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "min(21rem, 62vw)", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
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
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search titles or genres…"
                    aria-label="Search the catalog"
                    className="h-9 w-full rounded-lg border border-white/15 bg-white/5 pl-8 pr-8 text-sm text-ink placeholder:text-subtle focus-visible:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  />
                  {hasQuery ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
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
              aria-expanded={searchOpen}
              aria-label={searchOpen ? "Close search" : "Open search"}
              onClick={() => setSearchOpen((prev) => !prev)}
              className="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg text-ink transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {searchOpen ? <X className="size-5" aria-hidden /> : <Search className="size-5" aria-hidden />}
            </button>

            <div className="relative">
              <button
                type="button"
                aria-expanded={notificationsOpen}
                aria-haspopup="menu"
                aria-label="Notifications"
                onClick={() => {
                  setNotificationsOpen((prev) => !prev);
                  setProfileOpen(false);
                }}
                className="relative inline-flex size-10 cursor-pointer items-center justify-center rounded-lg text-ink transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Bell className="size-5" aria-hidden />
                <span aria-hidden className="absolute top-2 right-2 size-2 rounded-full bg-accent" />
              </button>
              <AnimatePresence>
                {notificationsOpen ? (
                  <motion.div
                    role="menu"
                    aria-label="Notifications"
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-white/10 bg-elevated/95 shadow-2xl backdrop-blur-xl"
                  >
                    <p className="border-b border-white/10 px-4 py-3 font-display text-sm font-semibold text-ink">
                      Notifications
                    </p>
                    <ul className="max-h-80 overflow-y-auto">
                      {notifications.map((notification) => (
                        <li key={notification.id} className="flex gap-3 px-4 py-3 hover:bg-white/5">
                          <div className="relative aspect-video w-16 shrink-0 overflow-hidden rounded-md">
                            <Image
                              src={notification.imageUrl}
                              alt=""
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-ink">{notification.title}</p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                              {notification.message}
                            </p>
                            <p className="mt-1 text-[10px] text-subtle">{notification.timeLabel}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="relative">
              {user ? (
                <button
                  type="button"
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                  aria-label="Profile menu"
                  onClick={() => {
                    setProfileOpen((prev) => !prev);
                    setNotificationsOpen(false);
                  }}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg p-1 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <span className="inline-flex size-8 items-center justify-center rounded-md border border-white/15 bg-elevated font-display text-sm font-bold text-gold">
                    {user.name.slice(0, 1).toUpperCase()}
                  </span>
                </button>
              ) : (
                <Link
                  href="/signin"
                  aria-label="Sign in"
                  className="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg text-ink transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <LogIn className="size-5" aria-hidden />
                </Link>
              )}
              <AnimatePresence>
                {user && profileOpen ? (
                  <motion.div
                    role="menu"
                    aria-label="Profile"
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-white/10 bg-elevated/95 py-1.5 shadow-2xl backdrop-blur-xl"
                  >
                    <div className="px-4 py-2">
                      <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                      <p className="truncate text-xs text-subtle">{user.email}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted">
                        <BookmarkCheck className="size-3.5 text-gold" aria-hidden />
                        {hydrated ? watchlistItems.length : 0} titles in My List
                      </p>
                    </div>
                    <div aria-hidden className="mx-3 border-t border-white/10" />
                    <form action={signOutAction}>
                      <button
                        type="submit"
                        role="menuitem"
                        className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm text-muted transition-colors hover:bg-white/5 hover:text-ink focus-visible:bg-white/5 focus-visible:text-ink focus-visible:outline-none"
                      >
                        <LogIn className="size-4 rotate-180" aria-hidden />
                        Sign out
                      </button>
                    </form>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </nav>

        {searchOpen ? (
          <div
            role="region"
            aria-label="Search results"
            aria-live="polite"
            className="border-t border-white/5 bg-night/60 px-4 pb-4 md:px-10"
          >
            {searchLabel ? (
              <p className="py-6 text-center text-sm text-muted">{searchLabel}</p>
            ) : null}
            {hasQuery && searchResults.state === "done" && searchResults.items.length > 0 ? (
              <ul className="grid max-h-[26rem] grid-cols-2 gap-2 overflow-y-auto py-3 sm:grid-cols-3 lg:grid-cols-4">
                {searchResults.items.map((item) => (
                  <li key={item.id}>
                    <SearchResultButton
                      item={item}
                      onSelect={() => {
                        openDetails(item);
                        setSearchOpen(false);
                      }}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
            {hasQuery &&
            searchResults.state === "done" &&
            searchResults.items.length === 0 &&
            !searchLabel ? (
              <div className="py-8 text-center">
                <p className="font-display text-base font-semibold text-ink">
                  No results for “{trimmedQuery}”
                </p>
                <p className="mt-1 text-sm text-muted">
                  Try a different title or genre, like “sci-fi” or “heist”.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} onNavigate={router.refresh} />
    </>
  );
}

function SearchResultButton({ item, onSelect }: { item: MediaSummary; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex w-full cursor-pointer items-center gap-3 rounded-lg border border-white/5 bg-card p-2 text-left transition-colors hover:border-white/20 hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      <div className="relative aspect-[2/3] w-10 shrink-0 overflow-hidden rounded-md">
        <Image src={item.posterUrl} alt="" fill sizes="40px" className="object-cover" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
        <p className="truncate text-xs text-muted">
          {item.type === "series" ? "Series" : "Movie"} · {item.genres.slice(0, 2).join(", ")}
        </p>
        <p className="text-[11px] text-gold">
          {formatRating(item.rating)} · {formatCardMeta(item.type, item.releaseYear, item.runtimeMinutes, item.seasonsCount)}
        </p>
      </div>
    </button>
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
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 left-0 z-[70] flex w-72 max-w-[82vw] flex-col border-r border-white/10 bg-elevated/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <span className="font-display text-lg font-bold text-ink">
                Cine<span className="text-accent">vide</span>
              </span>
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
                {!pathname.startsWith("/signin") ? (
                  <li>
                    <Link
                      href="/signin"
                      onClick={onClose}
                      className="block cursor-pointer rounded-lg px-4 py-3 text-sm font-medium text-muted transition-colors hover:bg-white/5 hover:text-ink"
                    >
                      Sign in
                    </Link>
                  </li>
                ) : null}
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
