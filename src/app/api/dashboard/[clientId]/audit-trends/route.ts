import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { visibilityScores } from "@/lib/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";

interface AuditTrendPoint {
  date: string;
  citability: number;
  brandAuthority: number;
  crawlerStatus: string;
}

/**
 * GET /api/dashboard/:clientId/audit-trends
 * Returns audit metric trends from visibility_scores.metadata over the last 90 days.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const scores = await db
    .select()
    .from(visibilityScores)
    .where(
      and(
        eq(visibilityScores.clientId, clientId),
        gte(visibilityScores.date, ninetyDaysAgo.toISOString().split("T")[0])
      )
    )
    .orderBy(visibilityScores.date);

  const trends: AuditTrendPoint[] = scores
    .map((s) => {
      const meta = (s.metadata ?? {}) as Record<string, unknown>;
      const citability = (meta.citabilityScore as number) ?? 0;
      const brandAuthority = (meta.brandAuthorityScore as number) ?? 0;
      const crawlerStatus = (meta.crawlerAccessStatus as string) ?? "unknown";

      // Only include points that have audit data
      if (citability === 0 && brandAuthority === 0 && crawlerStatus === "unknown") {
        return null;
      }

      return {
        date: s.date,
        citability,
        brandAuthority,
        crawlerStatus,
      };
    })
    .filter((p): p is AuditTrendPoint => p !== null);

  // Also get latest values for summary
  const latest = trends[trends.length - 1] ?? null;

  return NextResponse.json({
    clientId,
    trends,
    latest,
    dataPoints: trends.length,
  });
}
