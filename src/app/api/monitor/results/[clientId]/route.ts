import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { monitoringResults, monitoringQueries } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { processResultsBatch } from "@/lib/monitoring/result-processor";

/**
 * GET /api/monitor/results/:clientId — Get recent monitoring results
 * POST /api/monitor/results/:clientId — Process unprocessed results
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;
  const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "50", 10);
  const offset = parseInt(request.nextUrl.searchParams.get("offset") ?? "0", 10);

  const results = await db
    .select({
      result: monitoringResults,
      queryText: monitoringQueries.queryText,
      language: monitoringQueries.language,
    })
    .from(monitoringResults)
    .innerJoin(monitoringQueries, eq(monitoringResults.queryId, monitoringQueries.id))
    .where(eq(monitoringResults.clientId, clientId))
    .orderBy(desc(monitoringResults.queriedAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ results });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;

  try {
    const result = await processResultsBatch(clientId);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
