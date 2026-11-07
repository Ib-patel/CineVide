import "server-only";

export const env = {
  // Secure (HTTPS-only) cookies in production unless explicitly overridden.
  secureCookies:
    process.env.COOKIE_SECURE === "true" ||
    (process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false"),
  // Only trust client IP / geo headers when a reverse proxy we control sets them.
  // Vercel always overwrites these headers, so it is trusted automatically.
  trustProxyHeaders: process.env.TRUST_PROXY_HEADERS === "true" || process.env.VERCEL === "1",
  // Append the playback token to direct HLS URLs for edge validation (see /api/playback/verify).
  playbackUrlToken: process.env.PLAYBACK_URL_TOKEN === "true",
  playbackTokenSecret:
    process.env.PLAYBACK_TOKEN_SECRET || "cinevide-dev-playback-token-secret-change-in-prod",
} as const;
