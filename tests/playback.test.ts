import { describe, it, expect } from "vitest";
import { youtubeIdFrom } from "@/server/playback/providers";
import {
  authorizePlayback,
  signPlaybackToken,
  verifyPlaybackToken,
  PlaybackNotAuthorizedError,
} from "@/server/playback/service";

describe("Playback Authorization & Tokens", () => {
  it("signs and verifies tamper-proof playback tokens with expiration", () => {
    const expiresAt = Date.now() + 60000;
    const token = signPlaybackToken({
      userId: "user-123",
      mediaId: "spider-man-1423191",
      episodeId: null,
      clientIp: "127.0.0.1",
      expiresAt,
    });

    const verified = verifyPlaybackToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe("user-123");
    expect(verified?.mediaId).toBe("spider-man-1423191");

    // Tampered token must fail
    const tampered = token.replace("a", "b");
    expect(verifyPlaybackToken(tampered)).toBeNull();

    // Expired token must fail
    const expiredToken = signPlaybackToken({
      userId: "user-123",
      mediaId: "spider-man-1423191",
      episodeId: null,
      clientIp: "127.0.0.1",
      expiresAt: Date.now() - 1000,
    });
    expect(verifyPlaybackToken(expiredToken)).toBeNull();
  });

  it("authorizes movie playback with ogpb embed stream URL", async () => {
    const session = await authorizePlayback({
      userId: "user-123",
      mediaId: "the-dark-knight-155",
      clientIp: "127.0.0.1",
    });

    expect(session.format).toBe("ogpb");
    expect(session.provider).toBe("ogpb");
    expect(session.playbackUrl).toContain("https://embed.theogpiratebot.online/embed/movie/155");
    expect(session.token).toBeTruthy();
  });

  it("authorizes tv series playback with season and episode", async () => {
    const session = await authorizePlayback({
      userId: "user-123",
      mediaId: "stranger-things-66732",
      episodeId: "2",
      clientIp: "127.0.0.1",
    });

    expect(session.format).toBe("ogpb");
    expect(session.provider).toBe("ogpb");
    expect(session.playbackUrl).toContain("https://embed.theogpiratebot.online/embed/tv/66732/1/2");
    expect(session.episodeNumber).toBe(2);
    expect(session.nextEpisode?.episodeNumber).toBe(3);
  });

  it("rejects playback when slug contains no numeric TMDB ID", async () => {
    await expect(
      authorizePlayback({
        userId: "user-123",
        mediaId: "unknown-movie-without-id",
        clientIp: "127.0.0.1",
      })
    ).rejects.toThrow(PlaybackNotAuthorizedError);
  });

  it("extracts video ids from embed and watch URLs", () => {
    expect(youtubeIdFrom("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeIdFrom("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3")).toBe("dQw4w9WgXcQ");
    expect(youtubeIdFrom("not a url")).toBeNull();
  });
});
