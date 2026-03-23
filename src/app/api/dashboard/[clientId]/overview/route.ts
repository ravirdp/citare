import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { visibilityScores, monitoringQueries } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { DashboardOverview, PlatformScores, CompetitorData } from "@/types/monitoring";

/**
 * GET /api/dashboard/:clientId/overview
 * Returns dashboard overview data: scores, trends, competitors.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;

  // Latest score
  const scores = await db
    .select()
    .from(visibilityScores)
    .where(eq(visibilityScores.clientId, clientId))
    .orderBy(desc(visibilityScores.date))
    .limit(30);

  const latest = scores[0];

  // Active query count
  const queries = await db
    .select()
    .from(monitoringQueries)
    .where(eq(monitoringQueries.clientId, clientId));

  const activeQueries = queries.filter((q) => q.isActive);

  // Extract competitor data from latest score
  const competitors = (latest?.competitorComparison ?? []) as unknown as CompetitorData[];

  // Build trend data
  const trendData = scores
    .map((s) => ({
      date: s.date,
      score: parseFloat(s.overallScore ?? "0"),
      platforms: (s.platformScores ?? {}) as PlatformScores,
    }))
    .reverse(); // oldest first for chart

  const overview: DashboardOverview = {
    visibilityScore: parseFloat(latest?.overallScore ?? "0"),
    queriesMonitored: activeQueries.length,
    aiSearchValueInr: parseFloat(latest?.gadsEquivalentValueInr ?? "0"),
    competitorsTracked: competitors.length,
    platformBreakdown: (latest?.platformScores ?? {}) as PlatformScores,
    trendData,
    competitors,
  };

  return NextResponse.json(overview);
}
