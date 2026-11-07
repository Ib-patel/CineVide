process.env.COOKIE_SECURE = "false";
process.env.PLAYBACK_TOKEN_SECRET = "test-playback-secret-1234567890123456";

// `cacheLife()`/`cacheTag()` only work inside a Next.js render; outside it they throw.
// In unit tests "use cache" is a no-op string, so these become no-ops too.
import { vi } from "vitest";
vi.mock("next/cache", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/cache")>()),
  cacheLife: () => {},
  cacheTag: () => {},
}));
