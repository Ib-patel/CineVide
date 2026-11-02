import "server-only";
import { z } from "zod";
import { GENRE_VALUES } from "@/types";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().email("Enter a valid email address").max(254),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .refine((val) => /[a-zA-Z]/.test(val) && /[0-9]/.test(val), {
      message: "Password must contain at least one letter and one number",
    }),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(254),
  password: z.string().min(1, "Password is required").max(128),
});

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

export const watchlistSyncSchema = z.object({
  ids: z.array(z.string().min(1).max(64)).max(200),
});

export const progressSchema = z.object({
  mediaId: z.string().min(1).max(64),
  episodeId: z.string().min(1).max(64).nullable().optional(),
  positionSeconds: z.coerce.number().int().min(0).max(3600 * 40),
  durationSeconds: z.coerce.number().int().min(1).max(3600 * 40),
  completed: z.boolean().optional(),
});

export const progressQuerySchema = z.object({
  mediaId: z.string().min(1).max(64),
  episodeId: z.string().min(1).max(64).optional(),
});

export const playbackAuthorizeSchema = z.object({
  mediaId: z.string().min(1).max(64),
  episodeId: z.string().min(1).max(64).nullable().optional(),
  region: z.string().trim().length(2).optional(),
});

export const catalogSyncSchema = z.object({
  source: z.enum(["tmdb", "manual"]).default("tmdb"),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CatalogQueryInput = z.infer<typeof catalogQuerySchema>;
export type PlaybackAuthorizeInput = z.infer<typeof playbackAuthorizeSchema>;
