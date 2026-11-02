import { NextRequest } from "next/server";
import { DuplicateEmailError, loginUser, registerUser } from "@/server/auth/service";
import {
  createSessionForUser,
  destroyCurrentSession,
  SESSION_COOKIE,
  sessionExpiry,
} from "@/server/auth/session";
import { env } from "@/server/env";
import { handleRoute, apiError, apiOk, enforceRateLimit, NO_CACHE_HEADERS } from "@/server/http";
import { loginSchema, registerSchema } from "@/server/validators";

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const mode = new URL(request.url).searchParams.get("mode") === "login" ? "login" : "register";

    if (mode === "register") {
      // 5 registrations per hour per IP
      const rateLimitRes = enforceRateLimit(request, "auth_register", 5, 60 * 60 * 1000);
      if (rateLimitRes) return rateLimitRes;

      const body = await request.json().catch(() => null);
      const parsed = registerSchema.safeParse(body);
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        return apiError(400, "INVALID_INPUT", `${first.path.join(".") || "input"}: ${first.message}`);
      }
      try {
        const result = await registerUser(parsed.data);
        const token = await createSessionForUser(result.user.id);
        const res = apiOk({ user: result.user }, { status: 201, headers: NO_CACHE_HEADERS });
        res.cookies.set(SESSION_COOKIE(), token, {
          httpOnly: true,
          sameSite: "lax",
          secure: env.sessionSecureCookie,
          path: "/",
          expires: sessionExpiry(),
        });
        return res;
      } catch (error) {
        if (error instanceof DuplicateEmailError) {
          return apiError(409, "EMAIL_TAKEN", error.message);
        }
        throw error;
      }
    }

    // Login rate limiting: 10 attempts per 15 minutes per IP
    const rateLimitRes = enforceRateLimit(request, "auth_login", 10, 15 * 60 * 1000);
    if (rateLimitRes) return rateLimitRes;

    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return apiError(400, "INVALID_INPUT", `${first.path.join(".") || "input"}: ${first.message}`);
    }
    try {
      const result = await loginUser(parsed.data);
      await destroyCurrentSession().catch(() => undefined);
      const token = await createSessionForUser(result.user.id);
      const res = apiOk({ user: result.user }, { headers: NO_CACHE_HEADERS });
      res.cookies.set(SESSION_COOKIE(), token, {
        httpOnly: true,
        sameSite: "lax",
        secure: env.sessionSecureCookie,
        path: "/",
        expires: sessionExpiry(),
      });
      return res;
    } catch (error) {
      if (error instanceof Error && error.name === "InvalidCredentialsError") {
        return apiError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
      }
      throw error;
    }
  }, "POST /api/auth");
}

export async function DELETE() {
  return handleRoute(async () => {
    await destroyCurrentSession();
    const res = apiOk({ signedOut: true }, { headers: NO_CACHE_HEADERS });
    res.cookies.delete(SESSION_COOKIE());
    return res;
  }, "DELETE /api/auth (logout)");
}
