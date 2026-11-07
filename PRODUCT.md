# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Primary audience: people evaluating the product as a portfolio / demo of engineering and design quality (recruiters, clients, peers). They should be able to use it as a real streaming app: browse, search, open details, add to My List, sign in, and play titles.

## Product Purpose
Cinevide is a movie and web-series streaming web app with a premium experience comparable in quality and usability to leading streaming services, under its own distinct identity. Success: it feels like a finished, professional product, and every workflow works end to end.

## Positioning
Undecided by the user ("just redesign it"). Working position (inferred): a cinema-house identity of its own rather than a clone of Netflix, Prime Video, or JioHotstar. No branding or exact UI may be copied from those services.

## Capabilities and Constraints
- Next.js 16 App Router, TypeScript, Tailwind CSS v4, Framer Motion, Lucide icons.
- Live TMDB catalog (posters, backdrops, cast, ratings, genres); stateless, no database.
- Routes: home, /movies, /series, /trending, /my-list, /signin, /signup, not-found.
- Features that must keep working: hero billboard with rotation and keyboard nav, header search, profile/auth menu, My List count, hover previews, content detail modal with seasons/episodes, continue watching, video player (iframe/YouTube/HLS) with keyboard shortcuts, mobile tab bar, toasts, CSP and rate limiting.
- Tests: Vitest suite under `tests/`.

## Brand Commitments
Name "Cinevide" is fixed. Logo, colours, and fonts are free to change.

## Evidence on Hand
Real catalog metadata from TMDB at runtime. No testimonials, user counts, pricing, or press exist; do not fabricate them.

## Product Principles
1. Every existing workflow keeps working; redesign never breaks function.
2. Content imagery leads; the interface frames it.
3. Familiar streaming affordances (rows, resume, my list) stay where users expect them; identity lives in the details.
4. Distinct from the big streamers: no borrowed branding or signature layouts.

## Accessibility & Inclusion
Keep keyboard navigation, focus trapping in dialogs, skip link, and prefers-reduced-motion support already in place. Target WCAG AA contrast.
