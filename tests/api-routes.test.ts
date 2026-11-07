import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET as getCatalog } from "@/app/api/catalog/route";
import { GET as getContinueWatching } from "@/app/api/continue-watching/route";

describe("Route Handlers Direct Invocations", () => {
  it("GET /api/catalog returns paginated media envelope", async () => {
    const req = new NextRequest("http://localhost:3000/api/catalog?limit=5");
    const res = await getCatalog(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toBeDefined();
    expect(body.data.data).toHaveLength(5);
  });

  it("GET /api/continue-watching works without any sign-in", async () => {
    const res = await getContinueWatching();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.items).toEqual([]);
  });
});
