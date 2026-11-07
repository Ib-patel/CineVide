import "server-only";
import { z } from "zod";
import { GENRE_VALUES } from "@/types";

export const catalogQuerySchema = z.object({
  type: z.enum(["movie", "series"]).optional(),
  genre: z
    .string()
    .optional()
    .refine((value) => value === undefined || (GENRE_VALUES as readonly string[]).includes(value), {
      message: "Unknown genre",
    }),
  q: z.string().trim().max(120).optional(),
  sort: z.enum(["rating", "year", "popularity"]).optional(),
  cursor: z.coerce.number().int().min(0).max(100000).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const progressSchema = z
  .object({
    mediaId: z.string().min(1).max(64),
    episodeId: z.string().min(1).max(64).nullable().optional(),
    positionSeconds: z.coerce.number().int().min(0).max(3600 * 40).optional(),
    progressSeconds: z.coerce.number().int().min(0).max(3600 * 40).optional(),
    durationSeconds: z.coerce.number().int().min(1).max(3600 * 40),
    completed: z.boolean().optional(),
  })
  .transform((data) => ({
    mediaId: data.mediaId,
    episodeId: data.episodeId,
    positionSeconds: data.positionSeconds ?? data.progressSeconds ?? 0,
    durationSeconds: data.durationSeconds,
    completed: data.completed,
  }));

export const progressQuerySchema = z.object({
  mediaId: z.string().min(1).max(64),
  episodeId: z.string().min(1).max(64).optional(),
});

export const playbackAuthorizeSchema = z.object({
  mediaId: z.string().min(1).max(64),
  episodeId: z.string().min(1).max(64).nullable().optional(),
  allowDemo: z.boolean().optional(),
});

export const catalogSyncSchema = z.object({
  source: z.enum(["tmdb", "manual"]).default("tmdb"),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CatalogQueryInput = z.infer<typeof catalogQuerySchema>;
export type PlaybackAuthorizeInput = z.infer<typeof playbackAuthorizeSchema>;
