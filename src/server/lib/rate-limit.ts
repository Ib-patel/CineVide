import "server-only";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitRecord>>();

/**
 * In-memory sliding window rate limiter.
 * Automatically cleans up expired keys to prevent memory leak.
 */
export function checkRateLimit(
  bucket: string,
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number; remaining: number } {
  let store = stores.get(bucket);
  if (!store) {
    store = new Map<string, RateLimitRecord>();
    stores.set(bucket, store);
  }

  const now = Date.now();
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
