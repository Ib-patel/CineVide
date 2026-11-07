# Cinevide

Cinematic movie and web-series **streaming web application**, built with Next.js (App Router), TypeScript, Tailwind CSS v4, Framer Motion, and stateless live metadata & playback integration.

> **Content & Playback:** Titles, posters, cast, synopsis, and ratings stream dynamically. Video streaming is powered by responsive embedded player integration with support for custom streaming providers.

---

## Features

- **Cinematic hero billboard** with crossfading featured titles, preview video, keyboard navigation, and `prefers-reduced-motion` support.
- **Glassmorphic header** that transitions on scroll, real-time debounced search that shows Movies and Series results on the home screen, notifications, and live My List count.
- **Stateless Architecture**:
  - Live TMDB catalog proxy with rich metadata (cast, synopsis, ratings, backdrops, genres). Zero local database required.
  - No accounts or sign-in: My List is saved in the browser (`localStorage`), and watch progress / Continue Watching are keyed to an anonymous viewer cookie.
  - Short-lived HMAC-SHA256 playback authorization tokens (15-minute expiration) with tamper protection.
- **Security & Hardening**:
  - Content Security Policy (CSP), `X-Frame-Options`, `X-Content-Type-Options: nosniff`.
  - Rate limiting on playback endpoints.
  - Strict input validation with Zod.
- **Adaptive Video Player**:
  - Multi-source player supporting iframe embeds, YouTube, and HLS/MP4 streams.
  - Keyboard shortcuts (Space/K to toggle play, F for fullscreen, M for mute, Esc to close).
- **Quick Info modal**: Dynamic detail loading (`/api/catalog/media/[slug]`), season/episode selector, focus trap, and keyboard accessibility.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack, Partial Prerendering) |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS v4 (`@theme` tokens in `src/app/globals.css`, `@tailwindcss/postcss`) |
| **Animations** | Framer Motion |
| **Validation** | Zod v4 |
| **Icons** | Lucide React |
| **Testing** | Vitest 5 |

---

## Local Development & Setup

### Prerequisites

- Node.js v20+

### 1. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

### 2. Install Dependencies & Start Dev Server

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### 3. Verification & Testing

```bash
npm run build    # Next.js production build and TypeScript check
npm test         # Run Vitest test suite
```
