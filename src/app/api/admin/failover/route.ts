import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/user";
import { redis } from "@/lib/queue/client";

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

  try {
    const config = await redis.get<typeof DEFAULT_CONFIG>(REDIS_KEY);
    return NextResponse.json({ config: config ?? DEFAULT_CONFIG });
  } catch (err) {
    console.error("Failover GET error:", err);
    return NextResponse.json({ config: DEFAULT_CONFIG });
  }
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
    console.error("Failover POST error:", err);
    return NextResponse.json(
      { error: "Failed to update failover config" },
      { status: 500 }
    );
  }
}
