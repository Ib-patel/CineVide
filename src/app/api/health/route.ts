import { NextResponse } from "next/server";
import { NO_CACHE_HEADERS } from "@/server/http";

const startTime = Date.now();

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
      mode: "stateless",
    },
    {
      status: 200,
      headers: NO_CACHE_HEADERS,
    }
  );
}
