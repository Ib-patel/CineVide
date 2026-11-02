import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  hashSessionToken,
} from "@/server/lib/password";

describe("Password and Session Crypto", () => {
  it("hashes password in scrypt format", async () => {
    const raw = "SuperSecret123!";
    const hashed = await hashPassword(raw);

    expect(hashed).toMatch(/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/);
    expect(await verifyPassword(raw, hashed)).toBe(true);
    expect(await verifyPassword("WrongPassword", hashed)).toBe(false);
  });

  it("handles malformed hash safely without crashing", async () => {
    expect(await verifyPassword("pass", "invalid-hash")).toBe(false);
    expect(await verifyPassword("pass", "scrypt$1234")).toBe(false);
    expect(await verifyPassword("pass", "")).toBe(false);
  });

  it("generates random 32-byte session tokens and hashes with sha256", () => {
    const token1 = generateSessionToken();
    const token2 = generateSessionToken();

    expect(token1).toHaveLength(64);
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);

    const hash1 = hashSessionToken(token1);
    const hash2 = hashSessionToken(token1);
    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
  });
});
