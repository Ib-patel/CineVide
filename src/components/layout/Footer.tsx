import Link from "next/link";

const FOOTER_SECTIONS = [
  {
    heading: "Browse",
    links: ["Home", "Movies", "Series", "Trending", "My List"],
  },
  {
    heading: "Company",
    links: ["About Cinevide", "Careers", "Newsroom", "Contact"],
  },
  {
    heading: "Support",
    links: ["Help Center", "Devices", "Accessibility", "Status"],
  },
  {
    heading: "Legal",
    links: ["Terms of Use", "Privacy", "Cookie Preferences", "Notices"],
  },
] as const;

const SECTION_ROUTES: Record<string, string> = {
  Home: "/",
  Movies: "/movies",
  Series: "/series",
  Trending: "/trending",
  "My List": "/my-list",
};

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-surface pb-10 pt-12">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="flex items-center gap-2">
          <span className="font-display text-xl font-bold tracking-tight text-ink">
            Cine<span className="text-accent">vide</span>
          </span>
          <span className="rounded-md border border-white/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-muted uppercase">
            Preview & Real Catalog
          </span>
        </div>

        <nav aria-label="Footer" className="mt-8 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.heading}>
              <h3 className="text-xs font-semibold tracking-wider text-subtle uppercase">
                {section.heading}
              </h3>
              <ul className="mt-3 space-y-2">
                {section.links.map((label) => {
                  const href = SECTION_ROUTES[label];
                  return href ? (
                    <li key={label}>
                      <Link
                        href={href}
                        className="text-sm text-muted transition-colors hover:text-ink"
                      >
                        {label}
                      </Link>
                    </li>
                  ) : (
                    <li key={label}>
                      <span className="text-sm text-white/50" title="Not available in this demo">
                        {label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-10 space-y-2 border-t border-white/5 pt-6">
          <p className="text-xs leading-relaxed text-subtle">
            Cinevide combines verified catalog data with authorized playback streams. This product uses the TMDB API but is not endorsed or certified by TMDB. Sample preview media is CC0 licensed.
          </p>
          <p className="text-xs text-white/25">© 2026 Cinevide. Built with Next.js & PostgreSQL.</p>
        </div>
      </div>
    </footer>
  );
}
