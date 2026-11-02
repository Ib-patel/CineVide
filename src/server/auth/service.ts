import "server-only";
import { prisma } from "@/server/db";
import { hashPassword, verifyPassword } from "@/server/lib/password";
import type { SessionUser } from "@/types";

export class DuplicateEmailError extends Error {
  constructor() {
    super("An account with this email already exists.");
    this.name = "DuplicateEmailError";
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid email or password.");
    this.name = "InvalidCredentialsError";
  }
}

export interface AuthResult {
  user: SessionUser;
}

// 16-byte hex salt + 64-byte hex hash format for constant-time dummy verification
const DUMMY_HASH =
  "scrypt$0123456789abcdef0123456789abcdef$0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new DuplicateEmailError();
  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { name: input.name.trim(), email, passwordHash },
  });
  return { user: { id: user.id, email: user.email, name: user.name } };
}

export async function loginUser(input: { email: string; password: string }): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Prevent email enumeration via latency analysis (constant-time scrypt calculation)
    await verifyPassword(input.password, DUMMY_HASH);
    throw new InvalidCredentialsError();
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) throw new InvalidCredentialsError();
  return { user: { id: user.id, email: user.email, name: user.name } };
}

export async function signOutUser(): Promise<void> {
  // Callers delete the session row (via session.destroyCurrentSession).
}

export { createSessionForUser, destroyCurrentSession, getCurrentSessionUser } from "@/server/auth/session";
