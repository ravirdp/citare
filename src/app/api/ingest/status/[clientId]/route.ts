import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { dataSources } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/ingest/status/[clientId]
 * Returns the ingestion status for all data sources of a client.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = await params;

  const sources = await db
    .select()
    .from(dataSources)
    .where(eq(dataSources.clientId, clientId));

  const sourceStatuses = sources.map((s) => ({
    id: s.id,
    sourceType: s.sourceType,
    status: s.status,
    lastSyncAt: s.lastSyncAt?.toISOString() ?? null,
    nextSyncAt: s.nextSyncAt?.toISOString() ?? null,
    hasData: s.rawData != null && Object.keys(s.rawData as Record<string, unknown>).length > 0,
    errorCount: Array.isArray(s.errorLog) ? (s.errorLog as unknown[]).length : 0,
    latestError: Array.isArray(s.errorLog) && (s.errorLog as unknown[]).length > 0
      ? (s.errorLog as Array<{ message: string }>).at(-1)?.message ?? null
      : null,
  }));

  const hasErrors = sourceStatuses.some((s) => s.status === "error");
  const hasSyncing = sourceStatuses.some((s) => s.status === "syncing");
  const allActive = sourceStatuses.every((s) => s.status === "active");

  let overallStatus: string;
  if (sourceStatuses.length === 0) overallStatus = "pending";
  else if (hasSyncing) overallStatus = "syncing";
  else if (allActive) overallStatus = "active";
  else if (hasErrors) overallStatus = "partial_error";
  else overallStatus = "pending";

  return NextResponse.json({
    clientId,
    sources: sourceStatuses,
    overallStatus,
  });
}
