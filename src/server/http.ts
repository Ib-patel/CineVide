import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ensureViewer, type Viewer } from "@/server/viewer";
import { checkRateLimit } from "@/server/lib/rate-limit";
import { env } from "@/server/env";

export interface ApiErrorBody {
  error: { code: string; message: string };
}

export const NO_CACHE_HEADERS: Record<string, string> = {
  "Cache-Control": "private, no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
};

/**
 * Public, viewer-independent catalog data. Browsers keep it 5 minutes; shared caches
 * (CDN/proxy) keep it an hour and may serve a stale copy for a day while refetching.
 * Never use this on anything that reads the viewer cookie.
 */
export const CATALOG_CACHE_HEADERS: Record<string, string> = {
  "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
};

/** Search results: short-lived so new titles show up quickly. */
export const SEARCH_CACHE_HEADERS: Record<string, string> = {
  "Cache-Control": "public, max-age=60, s-maxage=600, stale-while-revalidate=3600",
};

export function apiOk<T>(data: T, init?: ResponseInit): NextResponse {
  const headers = new Headers(init?.headers);
  return NextResponse.json({ data }, { ...init, headers });
}

export function apiError(
  status: number,
  code: string,
  message: string,
  init?: ResponseInit
): NextResponse<ApiErrorBody> {
  const headers = new Headers(init?.headers);
  return NextResponse.json({ error: { code, message } }, { ...init, status, headers });
}

/**
 * Resolves the client IP for rate limiting and playback tokens.
 *
 * Forwarding headers are client-controlled unless a trusted proxy sets them, so
 * they are only read when TRUST_PROXY_HEADERS=true (or on Vercel). Without a
 * trusted proxy every request shares one key, which is the safe default for
 * local development.
 */
export function getClientIp(request: Request): string {
  if (!env.trustProxyHeaders) return "local";

  const platformIp =
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim();
  if (platformIp) return platformIp;

  // The right-most hop is the one appended by our proxy; earlier hops can be forged.
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const hops = xForwardedFor.split(",").map((hop) => hop.trim()).filter(Boolean);
    const last = hops[hops.length - 1];
    if (last) return last;
  }
  return "unknown";
}

/** Two-letter country code from a trusted edge proxy, or undefined when unknown. */
export function getClientRegion(request: Request): string | undefined {
  if (!env.trustProxyHeaders) return undefined;
  const region =
    request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry") || undefined;
  return region && /^[A-Za-z]{2}$/.test(region) ? region.toUpperCase() : undefined;
}

export function enforceRateLimit(
  request: Request,
  bucket: string,
  maxRequests: number,
  windowMs: number
): NextResponse<ApiErrorBody> | null {
  const ip = getClientIp(request);
  const result = checkRateLimit(bucket, ip, maxRequests, windowMs);
  if (!result.allowed) {
    return apiError(
      429,
      "TOO_MANY_REQUESTS",
      `Too many requests. Please try again in ${result.retryAfterSeconds} seconds.`,
      {
        headers: {
          "Retry-After": result.retryAfterSeconds.toString(),
          ...NO_CACHE_HEADERS,
        },
      }
    );
  }
  return null;
}

/** Wraps a handler and maps expected exceptions to consistent error responses. */
export async function handleRoute(
  handler: () => Promise<NextResponse>,
  routeName: string
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      ("digest" in error || (error as { name?: string }).name === "DynamicServerError")
    ) {
      throw error;
    }
    if (error instanceof ZodError) {
      const first = error.issues[0];
      const message = first ? `${first.path.join(".") || "input"}: ${first.message}` : "Invalid input";
      return apiError(400, "INVALID_INPUT", message);
    }
    console.error(`[${routeName}] unexpected error`, error);
    return apiError(500, "INTERNAL_ERROR", "An unexpected error occurred.");
  }
}

/** The anonymous viewer making this request (issued on first use; no sign-in exists). */
export async function requireViewer(): Promise<Viewer> {
  return ensureViewer();
}
