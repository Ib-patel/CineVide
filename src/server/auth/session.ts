import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/server/db";
import { env } from "@/server/env";
import { generateSessionToken, hashSessionToken } from "@/server/lib/password";
import type { SessionUser } from "@/types";

export const SESSION_COOKIE = () => env.sessionCookieName;

export function sessionExpiry(): Date {
  return new Date(Date.now() + env.sessionTtlDays * 24 * 60 * 60 * 1000);
}

async function getCookieStoreSafe() {
  try {
    return await cookies();
  } catch {
    return null;
  }
}

export async function createSessionForUser(userId: string): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = sessionExpiry();
  await prisma.session.create({
    data: { userId, tokenHash: hashSessionToken(token), expiresAt },
  });
  const store = await getCookieStoreSafe();
  store?.set(SESSION_COOKIE(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.sessionSecureCookie,
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export async function getCurrentSessionUser(): Promise<SessionUser | null> {
  const store = await getCookieStoreSafe();
  if (!store) return null;
  const token = store.get(SESSION_COOKIE())?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    // Delete expired session row immediately on detection
    void prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return { id: session.user.id, email: session.user.email, name: session.user.name };
}

export async function destroyCurrentSession(): Promise<void> {
  const store = await getCookieStoreSafe();
  if (!store) return;
  const token = store.get(SESSION_COOKIE())?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
  }
  store.delete(SESSION_COOKIE());
}

/** Prunes all expired sessions across the system (maintenance / health / cron). */
export async function purgeExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });
  return result.count;
}

export function requireSessionUserId(user: SessionUser | null): string | null {
  return user ? user.id : null;
}
