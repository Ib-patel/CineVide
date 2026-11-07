import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

// Only pages that exist. On phones the bottom tab bar already carries these.
const LINKS = [
  { label: "Home", href: "/" },
  { label: "Movies", href: "/movies" },
  { label: "Series", href: "/series" },
  { label: "Trending", href: "/trending" },
  { label: "My List", href: "/my-list" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-surface">
      <div className="mx-auto max-w-[1920px] px-4 py-8 md:px-10 md:py-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <Link
            href="/"
            aria-label="Cinevide home"
            className="w-fit rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Logo size="sm" />
          </Link>

          <nav aria-label="Footer" className="hidden md:block">
            <ul className="flex flex-wrap items-center gap-x-1 gap-y-2">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-white/[0.06] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-6 border-t border-white/5 pt-6">
          <p className="text-xs text-white/30">© 2026 Cinevide</p>
        </div>
      </div>
    </footer>
  );
}
