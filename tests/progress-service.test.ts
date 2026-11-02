import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/server/db";
import {
  saveProgress,
  getProgress,
  getContinueWatching,
  deleteUserProgress,
} from "@/server/services/progress";

describe("Progress Service", () => {
  let userAId: string;
  let userBId: string;

  beforeEach(async () => {
    await prisma.watchProgress.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    const uA = await prisma.user.create({
      data: {
        email: "progress_a@test.local",
        name: "User A",
        passwordHash: "dummy",
      },
    });
    userAId = uA.id;

    const uB = await prisma.user.create({
      data: {
        email: "progress_b@test.local",
        name: "User B",
        passwordHash: "dummy",
      },
    });
    userBId = uB.id;
  });

  it("saves progress and marks completed at >= 95%", async () => {
    // 50% progress
    await saveProgress({
      userId: userAId,
      mediaId: "neon-parallax",
      positionSeconds: 3000,
      durationSeconds: 6000,
    });

    const p1 = await getProgress(userAId, "neon-parallax");
    expect(p1?.positionSeconds).toBe(3000);
    expect(p1?.completed).toBe(false);

    let cw = await getContinueWatching(userAId);
    expect(cw).toHaveLength(1);
    expect(cw[0].media.slug).toBe("neon-parallax");

    // 96% progress (>= 95% threshold)
    await saveProgress({
      userId: userAId,
      mediaId: "neon-parallax",
      positionSeconds: 5800,
      durationSeconds: 6000,
    });

    const p2 = await getProgress(userAId, "neon-parallax");
    expect(p2?.completed).toBe(true);

    // Completed content is excluded from continue watching
    cw = await getContinueWatching(userAId);
    expect(cw).toHaveLength(0);
  });

  it("isolates progress across users and supports deletion", async () => {
    await saveProgress({
      userId: userAId,
      mediaId: "neon-parallax",
      positionSeconds: 1200,
      durationSeconds: 7200,
    });

    await saveProgress({
      userId: userBId,
      mediaId: "neon-parallax",
      positionSeconds: 2400,
      durationSeconds: 7200,
    });

    const pA = await getProgress(userAId, "neon-parallax");
    const pB = await getProgress(userBId, "neon-parallax");

    expect(pA?.positionSeconds).toBe(1200);
    expect(pB?.positionSeconds).toBe(2400);

    await deleteUserProgress(userAId, "neon-parallax");
    expect(await getProgress(userAId, "neon-parallax")).toBeNull();
    expect(await getProgress(userBId, "neon-parallax")).not.toBeNull();
  });
});
