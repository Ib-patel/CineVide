import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { NO_CACHE_HEADERS } from "@/server/http";

const startTime = Date.now();

export async function GET() {
  const startDb = Date.now();
  let dbConnected = false;
  let latencyMs = 0;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
    latencyMs = Date.now() - startDb;
  } catch (error) {
    console.error("[HealthCheck] database ping failed", error);
  }

  const status = dbConnected ? "ok" : "degraded";
  const httpStatus = dbConnected ? 200 : 503;

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
      database: {
        connected: dbConnected,
        latencyMs,
      },
    },
    {
      status: httpStatus,
      headers: NO_CACHE_HEADERS,
    }
  );
}
