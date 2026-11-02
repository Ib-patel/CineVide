import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env and configure it.`
    );
  }
  return value;
}

const databaseUrl = required("DATABASE_URL");

if (!/^(postgres(ql)?:|file:)/.test(databaseUrl)) {
  throw new Error("DATABASE_URL must be a postgresql:// (or file:) connection string.");
}

export const env = {
  databaseUrl,
  sessionCookieName: process.env.AUTH_SESSION_COOKIE || "cinevide_session",
  sessionTtlDays: Math.max(1, Number(process.env.AUTH_SESSION_TTL_DAYS) || 30),
  // Default to secure cookies in production unless explicitly overridden
  sessionSecureCookie:
    process.env.AUTH_SESSION_SECURE === "true" ||
    (process.env.NODE_ENV === "production" && process.env.AUTH_SESSION_SECURE !== "false"),
  tmdbApiKey: process.env.TMDB_API_KEY || "",
  playbackTokenSecret:
    process.env.PLAYBACK_TOKEN_SECRET || "cinevide-dev-playback-token-secret-change-in-prod",
} as const;
