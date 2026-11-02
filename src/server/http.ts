import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { getCurrentSessionUser } from "@/server/auth/session";
import { checkRateLimit } from "@/server/lib/rate-limit";
import type { SessionUser } from "@/types";

export interface ApiErrorBody {
  error: { code: string; message: string };
}

export const NO_CACHE_HEADERS: Record<string, string> = {
  "Cache-Control": "private, no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
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

export function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const first = xForwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") || "127.0.0.1";
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
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse();
    }
    if (error instanceof ZodError) {
      const first = error.issues[0];
      const message = first ? `${first.path.join(".") || "input"}: ${first.message}` : "Invalid input";
      return apiError(400, "INVALID_INPUT", message);
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError ||
      error instanceof Prisma.PrismaClientValidationError
    ) {
      console.error(`[${routeName}] database error`, error);
      return apiError(500, "DATABASE_ERROR", "A database error occurred.");
    }
    console.error(`[${routeName}] unexpected error`, error);
    return apiError(500, "INTERNAL_ERROR", "An unexpected error occurred.");
  }
}

export type AuthedResult = { user: SessionUser } | { response: NextResponse };

export async function requireUser(): Promise<SessionUser> {
  const sessionUser = await getCurrentSessionUser();
  if (!sessionUser) {
    throw new UnauthorizedError();
  }
  return sessionUser;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "UnauthorizedError";
  }
}

export function unauthorizedResponse(): NextResponse<ApiErrorBody> {
  return apiError(401, "UNAUTHORIZED", "You must be signed in to do that.", {
    headers: NO_CACHE_HEADERS,
  });
}
