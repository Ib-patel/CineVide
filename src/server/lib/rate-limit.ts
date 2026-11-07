import "server-only";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitRecord>>();

/** Sweep expired keys at most this often, so idle IPs do not accumulate forever. */
const SWEEP_INTERVAL_MS = 60 * 1000;
let lastSweepAt = 0;

function sweepExpired(now: number): void {
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return;
  lastSweepAt = now;
  for (const store of stores.values()) {
    for (const [key, record] of store) {
      if (now >= record.resetAt) store.delete(key);
    }
  }
}

/**
 * In-memory fixed-window rate limiter (per process; use a shared store such as
 * Redis when running more than one instance). Each key may make `maxRequests`
 * requests per `windowMs`, starting from its first request in the window.
 */
export function checkRateLimit(
  bucket: string,
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number; remaining: number } {
  const now = Date.now();
  sweepExpired(now);

  let store = stores.get(bucket);
  if (!store) {
    store = new Map<string, RateLimitRecord>();
    stores.set(bucket, store);
  }

  const record = store.get(key);

  if (!record || now >= record.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return { allowed: false, retryAfterSeconds, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, retryAfterSeconds: 0, remaining: maxRequests - record.count };
}

export function resetRateLimit(bucket: string, key: string): void {
  const store = stores.get(bucket);
  if (store) {
    store.delete(key);
  }
}
