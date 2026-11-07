import { describe, it, expect, beforeEach } from "vitest";
import { randomUUID } from "node:crypto";
import {
  saveProgress,
  getProgress,
  getContinueWatching,
  deleteUserProgress,
} from "@/server/services/progress";

describe("Progress Service", () => {
  let userAId: string;
  let userBId: string;

  beforeEach(() => {
    // Anonymous viewer ids, as issued by the viewer cookie.
    userAId = randomUUID();
    userBId = randomUUID();
  });

  it("saves progress and marks completed at >= 95%", async () => {
    // 50% progress
    await saveProgress({
      userId: userAId,
      mediaId: "test-movie-12345",
      positionSeconds: 3000,
      durationSeconds: 6000,
    });

    const p1 = await getProgress(userAId, "test-movie-12345");
    expect(p1?.positionSeconds).toBe(3000);
    expect(p1?.completed).toBe(false);

    // 96% progress (>= 95% threshold)
    await saveProgress({
      userId: userAId,
      mediaId: "test-movie-12345",
      positionSeconds: 5800,
      durationSeconds: 6000,
    });

    const p2 = await getProgress(userAId, "test-movie-12345");
    expect(p2?.positionSeconds).toBe(5800);
    expect(p2?.completed).toBe(true);
  });

  it("deletes user progress by mediaId", async () => {
    await saveProgress({
      userId: userAId,
      mediaId: "test-movie-54321",
      positionSeconds: 1200,
      durationSeconds: 5000,
    });

    const deleted = await deleteUserProgress(userAId, "test-movie-54321");
    expect(deleted).toBe(true);

    const check = await getProgress(userAId, "test-movie-54321");
    expect(check).toBeNull();
  });

  it("isolates progress between users", async () => {
    await saveProgress({
      userId: userAId,
      mediaId: "test-movie-shared",
      positionSeconds: 500,
      durationSeconds: 2000,
    });

    const fromB = await getProgress(userBId, "test-movie-shared");
    expect(fromB).toBeNull();
  });
});
