import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/user";
import { supabaseAdmin } from "@/lib/db/client";
import { redis } from "@/lib/queue/client";

interface ServiceCheck {
  name: string;
  status: "healthy" | "error";
  responseTimeMs: number;
  error?: string;
}

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

  const services: ServiceCheck[] = [];

  // Supabase check
  {
    const start = Date.now();
    try {
      await supabaseAdmin.from("agencies").select("id").limit(1);
      services.push({
        name: "Supabase",
        status: "healthy",
        responseTimeMs: Date.now() - start,
      });
    } catch (err) {
      services.push({
        name: "Supabase",
        status: "error",
        responseTimeMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Redis check
  {
    const start = Date.now();
    try {
      await redis.ping();
      services.push({
        name: "Redis",
        status: "healthy",
        responseTimeMs: Date.now() - start,
      });
    } catch (err) {
      services.push({
        name: "Redis",
        status: "error",
        responseTimeMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // QStash — configured check (no easy ping)
  {
    services.push({
      name: "QStash",
      status: process.env.QSTASH_TOKEN ? "healthy" : "error",
      responseTimeMs: 0,
      ...(process.env.QSTASH_TOKEN
        ? {}
        : { error: "QSTASH_TOKEN not configured" }),
    });
  }

  // Vercel — always healthy (we're running on it)
  {
    services.push({
      name: "Vercel",
      status: "healthy",
      responseTimeMs: 0,
    });
  }

  return NextResponse.json({
    services,
    checkedAt: new Date().toISOString(),
  });
}
