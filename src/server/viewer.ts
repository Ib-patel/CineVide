import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { env } from "@/server/env";

/**
 * Cinevide has no accounts. Each browser gets an anonymous, random viewer id in
 * an httpOnly cookie, which keys its watch progress and server-side My List.
 */
export interface Viewer {
  id: string;
}

export const VIEWER_COOKIE = "cinevide_viewer";
const VIEWER_TTL_DAYS = 365;
const VIEWER_ID_PATTERN = /^[0-9a-f-]{36}$/i;

async function cookieStore() {
  try {
    return await cookies();
  } catch {
    return null;
  }
}

/** Reads the viewer id without creating one (safe in Server Components). */
export async function getViewer(): Promise<Viewer | null> {
  const store = await cookieStore();
  const id = store?.get(VIEWER_COOKIE)?.value;
  return id && VIEWER_ID_PATTERN.test(id) ? { id } : null;
}

/**
 * Returns the viewer, issuing a new anonymous id when the browser has none.
 * Only call from Route Handlers or Server Actions, where cookies can be set.
 */
export async function ensureViewer(): Promise<Viewer> {
  const existing = await getViewer();
  if (existing) return existing;

  const id = randomUUID();
  const store = await cookieStore();
  store?.set(VIEWER_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.secureCookies,
    path: "/",
    maxAge: VIEWER_TTL_DAYS * 24 * 60 * 60,
  });
  return { id };
}
