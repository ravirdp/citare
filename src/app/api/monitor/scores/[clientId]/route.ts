import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { visibilityScores } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { computeVisibilityScore } from "@/lib/monitoring/scoring";

/**
 * GET /api/monitor/scores/:clientId — Get visibility scores (last 30 days)
 * POST /api/monitor/scores/:clientId — Compute score for today
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;

  const scores = await db
    .select()
    .from(visibilityScores)
    .where(eq(visibilityScores.clientId, clientId))
    .orderBy(desc(visibilityScores.date))
    .limit(30);

  return NextResponse.json({ scores });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;
  const today = new Date().toISOString().split("T")[0];

  try {
    const result = await computeVisibilityScore(clientId, today);
    return NextResponse.json({ success: true, date: today, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
