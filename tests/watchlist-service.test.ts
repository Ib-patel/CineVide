import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/server/db";
import {
  addToWatchlist,
  getUserWatchlist,
  removeFromWatchlist,
  syncGuestWatchlist,
} from "@/server/services/watchlist";

describe("Watchlist Service", () => {
  let userAId: string;
  let userBId: string;

  beforeEach(async () => {
    await prisma.watchlistItem.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    const uA = await prisma.user.create({
      data: {
        email: "usera@test.local",
        name: "User A",
        passwordHash: "dummy",
      },
    });
    userAId = uA.id;

    const uB = await prisma.user.create({
      data: {
        email: "userb@test.local",
        name: "User B",
        passwordHash: "dummy",
      },
    });
    userBId = uB.id;
  });

  it("adds and deduplicates watchlist items", async () => {
    const added1 = await addToWatchlist(userAId, "neon-parallax");
    expect(added1).toBe(true);

    // Idempotent duplicate add
    const added2 = await addToWatchlist(userAId, "neon-parallax");
    expect(added2).toBe(false);

    const list = await getUserWatchlist(userAId);
    expect(list).toHaveLength(1);
    expect(list[0].slug).toBe("neon-parallax");
  });

  it("removes items by id or slug", async () => {
    await addToWatchlist(userAId, "neon-parallax");
    await addToWatchlist(userAId, "aetherbound");

    const removed = await removeFromWatchlist(userAId, "neon-parallax");
    expect(removed).toBe(true);

    const list = await getUserWatchlist(userAId);
    expect(list).toHaveLength(1);
    expect(list[0].slug).toBe("aetherbound");
  });

  it("enforces strict user isolation", async () => {
    await addToWatchlist(userAId, "neon-parallax");
    await addToWatchlist(userBId, "aetherbound");

    const listA = await getUserWatchlist(userAId);
    expect(listA.map((i) => i.slug)).toEqual(["neon-parallax"]);

    const listB = await getUserWatchlist(userBId);
    expect(listB.map((i) => i.slug)).toEqual(["aetherbound"]);
  });

  it("syncs guest watchlist items safely ignoring unknown slugs", async () => {
    const synced = await syncGuestWatchlist(userAId, [
      "neon-parallax",
      "kaiju-sonata",
      "non-existent-movie-id-12345",
    ]);

    expect(synced).toHaveLength(2);
    const slugs = synced.map((s) => s.slug);
    expect(slugs).toContain("neon-parallax");
    expect(slugs).toContain("kaiju-sonata");
  });
});
