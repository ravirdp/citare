import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/user";
import { redis } from "@/lib/queue/client";

const REDIS_KEY = "citare:config:model_routing";

const DEFAULT_CONFIG = {
  tier_one: "claude-opus-4-0-20250514",
  tier_two: "claude-sonnet-4-20250514",
  tier_three: "claude-haiku-4-5-20251001",
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
  // Model routing config rarely changes — only read from Redis when
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

  try {
    const body = await request.json();
    const current = await redis.get<typeof DEFAULT_CONFIG>(REDIS_KEY);
    const merged = { ...(current ?? DEFAULT_CONFIG), ...body };

    await redis.set(REDIS_KEY, merged);

    return NextResponse.json({ config: merged });
  } catch (err) {
    console.error("Model routing POST error:", err);
    return NextResponse.json(
      { error: "Failed to update model routing" },
      { status: 500 }
    );
  }
}
