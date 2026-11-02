import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/server/db";
import {
  authorizePlayback,
  signPlaybackToken,
  verifyPlaybackToken,
  PlaybackNotAuthorizedError,
} from "@/server/playback/service";

describe("Playback Authorization & Tokens", () => {
  let testUserId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: `playback_test_${Date.now()}@cinevide.local`,
        name: "Playback Tester",
        passwordHash: "dummy",
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    await prisma.playbackAsset.deleteMany({
      where: { streamUrl: { contains: "uk/master.m3u8" } },
    });
    await prisma.media.deleteMany({
      where: { slug: { startsWith: "uk-only-title" } },
    });
  });

  it("signs and verifies tamper-proof playback tokens with expiration", () => {
    const expiresAt = Date.now() + 60000;
    const token = signPlaybackToken({
      userId: testUserId,
      mediaId: "neon-parallax",
      episodeId: null,
      clientIp: "127.0.0.1",
      expiresAt,
    });

    const verified = verifyPlaybackToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(testUserId);
    expect(verified?.mediaId).toBe("neon-parallax");

    // Tampered token must fail
    const tampered = token.replace("a", "b");
    expect(verifyPlaybackToken(tampered)).toBeNull();

    // Expired token must fail
    const expiredToken = signPlaybackToken({
      userId: testUserId,
      mediaId: "neon-parallax",
      episodeId: null,
      clientIp: "127.0.0.1",
      expiresAt: Date.now() - 1000,
    });
    expect(verifyPlaybackToken(expiredToken)).toBeNull();
  });

  it("authorizes playback for media with active PlaybackAsset", async () => {
    const session = await authorizePlayback({
      userId: testUserId,
      mediaId: "neon-parallax",
      clientIp: "127.0.0.1",
      clientRegion: "US",
    });

    expect(session.playbackUrl).toContain("master.m3u8");
    expect(session.format).toBe("hls");
    expect(session.isDemo).toBe(false);
    expect(session.token).toBeDefined();
  });

  it("blocks playback when media is METADATA_ONLY", async () => {
    await expect(
      authorizePlayback({
        userId: testUserId,
        mediaId: "metadata-only-title",
        clientIp: "127.0.0.1",
      })
    ).rejects.toThrow(PlaybackNotAuthorizedError);
  });

  it("enforces region restrictions on licensed playback assets", async () => {
    // "neon-parallax" allowed regions are ["GLOBAL", "US", "IN"] in test setup
    // Let's create an asset restricted to "GB" only
    const restrictedMedia = await prisma.media.create({
      data: {
        slug: `uk-only-title-${Date.now()}`,
        title: "UK Only Film",
        synopsis: "Region test",
        type: "MOVIE",
        posterUrl: "https://picsum.photos/seed/uk/480/720",
        backdropUrl: "https://picsum.photos/seed/uk-bg/1920/1080",
        releaseYear: 2025,
        rating: 8.0,
        ageRating: "15",
        maxResolution: "HD",
        director: "Director",
        matchPercent: 90,
        availability: "AVAILABLE",
        playbackAssets: {
          create: {
            playbackProvider: "hls",
            streamUrl: "https://cdn.cinevide.local/uk/master.m3u8",
            allowedRegions: JSON.stringify(["GB"]),
            status: "ACTIVE",
          },
        },
      },
    });

    // Request from US must be rejected
    await expect(
      authorizePlayback({
        userId: testUserId,
        mediaId: restrictedMedia.id,
        clientIp: "127.0.0.1",
        clientRegion: "US",
      })
    ).rejects.toThrow("not licensed for playback in region US");

    // Request from GB must succeed
    const session = await authorizePlayback({
      userId: testUserId,
      mediaId: restrictedMedia.id,
      clientIp: "127.0.0.1",
      clientRegion: "GB",
    });
    expect(session.format).toBe("hls");
  });
});
