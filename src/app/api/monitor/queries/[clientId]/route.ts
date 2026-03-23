import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { monitoringQueries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateQueriesForClient } from "@/lib/monitoring/query-builder";

/**
 * POST /api/monitor/queries/:clientId — Generate monitoring queries from KG
 * GET /api/monitor/queries/:clientId — List active queries
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;

  try {
    const result = await generateQueriesForClient(clientId);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;

  const queries = await db
    .select()
    .from(monitoringQueries)
    .where(eq(monitoringQueries.clientId, clientId));

  return NextResponse.json({ queries });
}
