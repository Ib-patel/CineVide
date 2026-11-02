import "server-only";
import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

// scrypt parameters (Node defaults: N=16384, r=8, p=1).
const SCRYPT_KEYLEN = 64;

/** Format: scrypt$<salt-hex>$<hash-hex> */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scryptAsync(password, salt, SCRYPT_KEYLEN)) as Buffer;
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const storedHash = Buffer.from(hashHex, "hex");
  const derived = (await scryptAsync(password, Buffer.from(saltHex, "hex"), storedHash.length)) as Buffer;
  return derived.length === storedHash.length && timingSafeEqual(derived, storedHash);
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/** Sessions store the SHA-256 of the cookie token, never the token itself. */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
