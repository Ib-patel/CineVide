import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/server/db";
import { GET as getCatalog } from "@/app/api/catalog/route";
import { GET as getMediaBySlug } from "@/app/api/catalog/media/[slug]/route";
import { GET as getWatchlist } from "@/app/api/watchlist/route";
import { POST as authRoute } from "@/app/api/auth/route";

describe("Route Handlers Direct Invocations", () => {
  beforeEach(async () => {
    await prisma.watchlistItem.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  it("GET /api/catalog returns paginated media envelope", async () => {
    const req = new NextRequest("http://localhost:3000/api/catalog?limit=5");
    const res = await getCatalog(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toBeDefined();
    expect(body.data.data).toHaveLength(5);
    expect(body.data.total).toBeGreaterThanOrEqual(26);
  });

  it("GET /api/catalog/media/[slug] returns 200 for valid and 404 for missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/catalog/media/neon-parallax");
    const res = await getMediaBySlug(req, {
      params: Promise.resolve({ slug: "neon-parallax" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.slug).toBe("neon-parallax");

    const missingReq = new NextRequest("http://localhost:3000/api/catalog/media/does-not-exist");
    const missingRes = await getMediaBySlug(missingReq, {
      params: Promise.resolve({ slug: "does-not-exist" }),
    });
    expect(missingRes.status).toBe(404);
  });

  it("POST /api/auth register mode creates user", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth?mode=register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "register_test@example.com",
        password: "Password123!",
      }),
    });
    const res = await authRoute(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.user.email).toBe("register_test@example.com");

    // Session cookie should be set
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("cinevide_session=");
  });

  it("GET /api/watchlist returns 401 unauthorized when guest", async () => {
    const res = await getWatchlist();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});
