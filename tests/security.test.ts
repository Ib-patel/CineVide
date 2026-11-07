import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimit } from "@/server/lib/rate-limit";

describe("Security and Hardening Tests", () => {
  beforeEach(async () => {
    resetRateLimit("test_bucket", "127.0.0.1");
  });

  describe("Sliding Window Rate Limiter", () => {
    it("enforces request limits within window", () => {
      const bucket = "test_bucket";
      const ip = "127.0.0.1";

      for (let i = 0; i < 3; i++) {
        const res = checkRateLimit(bucket, ip, 3, 10000);
        expect(res.allowed).toBe(true);
      }

      // 4th request must be blocked
      const blocked = checkRateLimit(bucket, ip, 3, 10000);
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
      expect(blocked.remaining).toBe(0);
    });
  });
});
