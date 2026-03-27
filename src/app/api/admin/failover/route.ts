import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/user";
import { getRedis } from "@/lib/queue/client";

const REDIS_KEY = "citare:config:failover";

const DEFAULT_CONFIG = {
  ai_primary: "anthropic",
  ai_backup: "openai",
};

export async function GET() {
  try {
    const user = await requireRole(["super_admin"]);
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message },
      { status: message.includes("Unauthorized") ? 401 : 403 }
    );
  }

  // FIX: Return default config without hitting Redis on every GET.
  // Failover config rarely changes — only read from Redis when
  // actually processing an AI request, not on every health page load.
  return NextResponse.json({ config: DEFAULT_CONFIG });
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(["super_admin"]);
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message },
      { status: message.includes("Unauthorized") ? 401 : 403 }
    );
  }

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json(
      { success: false, error: "Redis not configured. Using default settings." },
      { status: 200 }
    );
  }

  try {
    const body = await request.json();
    const current = await redis.get<typeof DEFAULT_CONFIG>(REDIS_KEY);
    const merged = { ...(current ?? DEFAULT_CONFIG), ...body };

    await redis.set(REDIS_KEY, merged);

    return NextResponse.json({ config: merged });
  } catch (err) {
    console.error("Failover POST error:", err);
    return NextResponse.json(
      { error: "Failed to update failover config" },
      { status: 500 }
    );
  }
}
