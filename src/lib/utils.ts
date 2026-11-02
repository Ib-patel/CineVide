import { isSeries } from "@/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export { isSeries };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatMinutesShort(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  return formatRuntime(minutes);
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

export function formatRemaining(progressSeconds: number, durationSeconds: number): string {
  const min = Math.max(0, Math.ceil((durationSeconds - progressSeconds) / 60));
  return `${min} min left`;
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/** Card meta line: "12 Seasons" for series, "2025 · 1h 54m" for movies. */
export function formatCardMeta(
  type: "movie" | "series",
  releaseYear: number,
  runtimeMinutes: number | null,
  seasonsCount: number | null
): string {
  if (type === "series") {
    const count = seasonsCount ?? 0;
    return count === 1 ? "1 Season" : `${count} Seasons`;
  }
  if (!runtimeMinutes) return String(releaseYear);
  return `${releaseYear} · ${formatRuntime(runtimeMinutes)}`;
}
