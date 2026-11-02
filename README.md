# Cinevide

Premium cinematic movie and web-series **streaming web application**, built with Next.js (App Router), TypeScript, Tailwind CSS v4, Framer Motion, Prisma, and PostgreSQL.

> **Disclaimer & Attribution:** All catalog titles, synopses, and imagery are sourced either from fictional demo fixtures or The Movie Database (TMDB). This product uses the TMDB API but is not endorsed or certified by TMDB. The sample preview player uses freely licensed CC0 sample video footage and is clearly labeled **Demo Preview Mode**. Real playback requires active, signed `PlaybackAsset` licensing.

---

## Features

- **Cinematic hero billboard** with crossfading featured titles, demo preview video, keyboard arrows, and `prefers-reduced-motion` support.
- **Glassmorphic header** that transitions on scroll, with real-time API search (debounced), notifications menu, auth-aware profile menu, and live My List count.
- **Production-grade Authentication**:
  - Scrypt password hashing (`node:crypto.scrypt`) with constant-time verification against email enumeration attacks.
  - Password complexity validation (minimum 8 characters, at least one letter and one number).
  - Sliding-window in-memory rate limiting on login (10 attempts / 15m) and registration (5 accounts / 1h).
  - SHA-256 session token hashing, HttpOnly `SameSite=lax` session cookies with automatic production `Secure` flags.
  - Automatic expired-session pruning and `/api/health` monitoring.
- **Security Hardening**:
  - Full Content Security Policy (CSP), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and HSTS.
  - Explicit `Cache-Control: private, no-store` on all authenticated and personalized endpoints.
  - Strict user-isolation on watchlist, watch progress, and playback sessions.
- **Real Catalog Provider Integration**:
  - Provider abstraction interface (`CatalogProvider`) supporting real metadata sources.
  - The Movie Database (TMDB) integration with API key configuration and robust deterministic offline fallback dataset.
  - Idempotent catalog synchronization (`npm run catalog:sync`) that strictly preserves editorial choices (`trendingRank`, `isFeatured`, `popularity`, `isExclusive`).
  - Differentiated availability states: `AVAILABLE`, `COMING_SOON`, `METADATA_ONLY`, `REGION_RESTRICTED`, `UNAVAILABLE`.
- **Authorized Streaming & Playback Architecture**:
  - Rights and asset model via `PlaybackAsset` schema supporting HLS and MP4 delivery.
  - Server-side playback authorization (`POST /api/playback/authorize`) verifying user authentication, license windows, and geographic restrictions.
  - Short-lived HMAC-SHA256 playback token signing (15-minute expiration).
  - Adaptive player supporting authorized HLS/MP4 playback with clear badges ("Authorized Stream" vs "Demo Preview Mode" vs "Metadata Only (Not Streamable)").
  - Throttled progress persistence (~5s), pause save, window unload keepalive beacon, and 95% completion detection.
- **Dual-mode watchlist**: Local storage for guest browsing, with automatic one-time cloud synchronization upon sign-in.
- **Quick Info modal**: Dynamic detail loading (`/api/catalog/media/[slug]`), season selector, episode guide, focus trap, and keyboard accessibility (ESC).

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack, Partial Prerendering) |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS v4 (`@theme` tokens in `src/app/globals.css`, `@tailwindcss/postcss`) |
| **Animations** | Framer Motion |
| **Database & ORM** | PostgreSQL 16 + Prisma 6.19 |
| **Validation** | Zod v4 |
| **Icons** | Lucide React |
| **Testing** | Vitest 5 |

---

## Local Development & Setup

### Prerequisites

- Node.js v20+ (tested on Node v24)
- Docker & Docker Compose

### 1. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Ensure `.env` contains:

```env
DATABASE_URL="postgresql://cinevide:cinevide_dev@localhost:54322/cinevide"
AUTH_SESSION_COOKIE="cinevide_session"
AUTH_SESSION_TTL_DAYS="30"
AUTH_SESSION_SECURE="false"

# Optional TMDB API Key (falls back to curated offline dataset if blank)
TMDB_API_KEY=""

# Playback HMAC Token Secret
PLAYBACK_TOKEN_SECRET="cinevide-dev-playback-token-secret-change-in-prod"
```

### 2. Start PostgreSQL

Start the PostgreSQL 16 Alpine container:

```bash
docker compose up -d
```

### 3. Run Migrations & Seed Data

Deploy migrations and populate the database with the curated catalog titles, sample playback assets, and demo user:

```bash
npm run db:migrate
npm run db:seed
```

Demo login credentials:
- **Email:** `demo@cinevide.local`
- **Password:** `Password123!`

### 4. Synchronize Real Catalog (TMDB)

Run the metadata synchronization script to import real movie and series metadata:

```bash
npm run catalog:sync
```

### 5. Start the Application

```bash
npm run dev      # http://localhost:3000 (or http://localhost:3100 if 3000 is occupied)
```

For production builds:

```bash
npm run build
npm run start -p 3100
```

---

## Testing & Quality Checks

Run the automated verification suite:

```bash
# Type check
npx tsc --noEmit

# ESLint
npm run lint

# Unit & Integration Tests (29 tests across 8 suites)
npm test

# Production Build
npm run build
```

---

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | Service liveness & database ping status | No |
| `GET` | `/api/catalog` | List catalog items with filters & offset pagination | No |
| `GET` | `/api/catalog/media/[slug]` | Get full media detail with seasons & episodes | No |
| `GET` | `/api/catalog/movies` | Get movie titles | No |
| `GET` | `/api/catalog/series` | Get web series | No |
| `GET` | `/api/catalog/trending` | Get Top 10 trending items | No |
| `GET` | `/api/catalog/top-rated` | Get top-rated media | No |
| `POST` | `/api/auth?mode=register` | Register a new account (rate limited) | No |
| `POST` | `/api/auth?mode=login` | Log in with credentials (rate limited, timing-protected) | No |
| `GET` | `/api/auth/me` | Fetch active session profile (no-store) | Yes |
| `DELETE` | `/api/auth` | Sign out / destroy session | Yes |
| `POST` | `/api/playback/authorize`| Authorize stream & generate short-lived signed token | Yes |
| `GET` | `/api/watchlist` | Get user's cloud watchlist (no-store) | Yes |
| `POST` | `/api/watchlist` | Add media to watchlist | Yes |
| `DELETE`| `/api/watchlist/[mediaId]`| Remove media from watchlist | Yes |
| `POST` | `/api/watchlist/sync` | Sync guest watchlist IDs to account | Yes |
| `GET` | `/api/continue-watching`| Get active in-progress media | Yes |
| `GET` | `/api/progress` | Get position for media & episode | Yes |
| `POST` | `/api/progress` | Save watch progress | Yes |
| `DELETE`| `/api/progress/[mediaId]`| Delete progress for media | Yes |
