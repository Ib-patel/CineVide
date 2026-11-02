import "server-only";

type LogLevel = "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  message: string;
  context?: string;
  timestamp: string;
  details?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
  };
}

function sanitize(obj: unknown): unknown {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);

  const sanitized: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (/password|token|secret|authorization|cookie/i.test(k)) {
      sanitized[k] = "[REDACTED]";
    } else if (typeof v === "object") {
      sanitized[k] = sanitize(v);
    } else {
      sanitized[k] = v;
    }
  }
  return sanitized;
}

function log(level: LogLevel, message: string, context?: string, details?: unknown, err?: unknown) {
  const payload: LogPayload = {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  };

  if (details && typeof details === "object") {
    payload.details = sanitize(details) as Record<string, unknown>;
  }

  if (err instanceof Error) {
    payload.error = {
      name: err.name,
      message: err.message,
    };
  }

  const json = JSON.stringify(payload);
  if (level === "error") {
    console.error(json);
  } else if (level === "warn") {
    console.warn(json);
  } else {
    console.log(json);
  }
}

export const logger = {
  info: (msg: string, ctx?: string, details?: unknown) => log("info", msg, ctx, details),
  warn: (msg: string, ctx?: string, details?: unknown, err?: unknown) => log("warn", msg, ctx, details, err),
  error: (msg: string, ctx?: string, details?: unknown, err?: unknown) => log("error", msg, ctx, details, err),
};
