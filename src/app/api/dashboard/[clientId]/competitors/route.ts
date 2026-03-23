import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { monitoringResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { CompetitorData, PlatformScores } from "@/types/monitoring";

/**
 * GET /api/dashboard/:clientId/competitors
 * Aggregate competitor data from monitoring results.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;

  const results = await db
    .select()
    .from(monitoringResults)
    .where(eq(monitoringResults.clientId, clientId));

  // Aggregate competitors
  const competitorMap = new Map<
    string,
    { mentions: number; positions: number[]; platforms: Map<string, number> }
  >();

  for (const r of results) {
    const mentions = (r.competitorMentions ?? []) as Array<{
      name: string;
      position: number | null;
    }>;
    for (const cm of mentions) {
      if (!competitorMap.has(cm.name)) {
        competitorMap.set(cm.name, { mentions: 0, positions: [], platforms: new Map() });
      }
      const entry = competitorMap.get(cm.name)!;
      entry.mentions++;
      if (cm.position) entry.positions.push(cm.position);
      entry.platforms.set(r.platform, (entry.platforms.get(r.platform) ?? 0) + 1);
    }
  }

  const competitors: CompetitorData[] = Array.from(competitorMap.entries())
    .map(([name, data]) => ({
      name,
      totalMentions: data.mentions,
      avgPosition:
        data.positions.length > 0
          ? Math.round((data.positions.reduce((a, b) => a + b, 0) / data.positions.length) * 10) / 10
          : 0,
      platformBreakdown: Object.fromEntries(data.platforms) as PlatformScores,
    }))
    .sort((a, b) => b.totalMentions - a.totalMentions);

  return NextResponse.json({ competitors });
}
