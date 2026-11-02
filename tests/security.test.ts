import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/server/db";
import { checkRateLimit, resetRateLimit } from "@/server/lib/rate-limit";
import { registerSchema } from "@/server/validators";
import { purgeExpiredSessions } from "@/server/auth/session";

describe("Security and Hardening Tests", () => {
  beforeEach(async () => {
    resetRateLimit("test_bucket", "127.0.0.1");
  });

  describe("Password Policy", () => {
    it("rejects passwords lacking letters or numbers", () => {
      // Missing number
      const noNum = registerSchema.safeParse({
        name: "Test",
        email: "test@example.com",
        password: "justletters",
      });
      expect(noNum.success).toBe(false);

      // Missing letter
      const noLetter = registerSchema.safeParse({
        name: "Test",
        email: "test@example.com",
        password: "1234567890",
      });
      expect(noLetter.success).toBe(false);

      // Too short
      const tooShort = registerSchema.safeParse({
        name: "Test",
        email: "test@example.com",
        password: "p1",
      });
      expect(tooShort.success).toBe(false);

      // Valid strong password
      const valid = registerSchema.safeParse({
        name: "Test",
        email: "test@example.com",
        password: "Password123!",
      });
      expect(valid.success).toBe(true);
    });
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

  describe("Expired Session Cleanup", () => {
    it("prunes expired session records from database", async () => {
      const testUser = await prisma.user.create({
        data: {
          email: "expire_test@cinevide.local",
          name: "Expire Test",
          passwordHash: "dummy",
        },
      });

      // Insert an already-expired session
      await prisma.session.create({
        data: {
          userId: testUser.id,
          tokenHash: "dummy_expired_hash_12345",
          expiresAt: new Date(Date.now() - 3600000), // 1 hour in past
        },
      });

      const pruned = await purgeExpiredSessions();
      expect(pruned).toBeGreaterThanOrEqual(1);

      const found = await prisma.session.findUnique({
        where: { tokenHash: "dummy_expired_hash_12345" },
      });
      expect(found).toBeNull();
    });
  });
});
