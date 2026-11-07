import type { ContinueWatchingEntry, MediaDetail, MediaSummary, PlaybackSession } from "@/types";

export interface ApiEnvelope<T> {
  data: T;
}

export interface ApiErrorEnvelope {
  error: { code: string; message: string };
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; code: string; message: string };

async function parseError(
  response: Response
): Promise<{ ok: false; status: number; code: string; message: string }> {
  try {
    const body = (await response.json()) as ApiErrorEnvelope;
    return {
      ok: false,
      status: response.status,
      code: body.error?.code ?? "REQUEST_FAILED",
      message: body.error?.message ?? (response.statusText || "Request failed"),
    };
  } catch {
    return {
      ok: false,
      status: response.status,
      code: "REQUEST_FAILED",
      message: response.statusText || "Request failed",
    };
  }
}

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<ApiResult<T>> {
  const response = await fetch(path, { signal, credentials: "same-origin" });
  if (!response.ok) return parseError(response);
  const body = (await response.json()) as ApiEnvelope<T>;
  return { ok: true, data: body.data };
}

export async function apiSend<T>(
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) return parseError(response);
    const json = (await response.json()) as ApiEnvelope<T>;
    return { ok: true, data: json.data };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      code: "NETWORK_ERROR",
      message: error instanceof Error ? error.message : "Network error",
    };
  }
}

export interface ProgressPayload {
  mediaId: string;
  episodeId?: string | null;
  positionSeconds?: number;
  progressSeconds?: number;
  durationSeconds: number;
  completed?: boolean;
}

export const continueWatchingApi = {
  /** This browser's in-progress titles (keyed by the anonymous viewer cookie). */
  async list(signal?: AbortSignal): Promise<ContinueWatchingEntry[]> {
    try {
      const result = await apiGet<{ items: ContinueWatchingEntry[] }>("/api/continue-watching", signal);
      return result.ok ? result.data.items : [];
    } catch {
      return [];
    }
  },
};

export const progressApi = {
  async save(payload: ProgressPayload): Promise<boolean> {
    const body = {
      ...payload,
      positionSeconds: payload.positionSeconds ?? payload.progressSeconds ?? 0,
    };
    const result = await apiSend("POST", "/api/progress", body);
    return result.ok;
  },
  async delete(mediaId: string): Promise<boolean> {
    const result = await apiSend("DELETE", `/api/progress/${encodeURIComponent(mediaId)}`);
    return result.ok;
  },
  async saveKeepalive(payload: ProgressPayload): Promise<void> {
    try {
      const body = {
        ...payload,
        positionSeconds: payload.positionSeconds ?? payload.progressSeconds ?? 0,
      };
      fetch("/api/progress", {
        method: "POST",
        credentials: "same-origin",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).catch(() => undefined);
    } catch {
      // page is unloading; nothing further to do
    }
  },
};

export const catalogApi = {
  /** Returns null on failure, including when the request is aborted; callers check their signal. */
  async search(query: string, signal?: AbortSignal, limit = 12): Promise<MediaSummary[] | null> {
    try {
      const result = await apiGet<{ data: MediaSummary[]; nextCursor: number | null; total: number }>(
        `/api/catalog?q=${encodeURIComponent(query)}&limit=${limit}`,
        signal
      );
      return result.ok ? result.data.data : null;
    } catch {
      return null;
    }
  },
  async detailBySlug(slug: string, signal?: AbortSignal): Promise<MediaDetail | null> {
    const result = await apiGet<MediaDetail>(`/api/catalog/media/${encodeURIComponent(slug)}`, signal);
    return result.ok ? result.data : null;
  },
};

export const playbackApi = {
  async authorize(params: {
    mediaId: string;
    episodeId?: string | null;
    allowDemo?: boolean;
  }): Promise<ApiResult<PlaybackSession>> {
    return apiSend<PlaybackSession>("POST", "/api/playback/authorize", params);
  },
};
