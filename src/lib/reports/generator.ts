import { db } from "@/lib/db/client";
import {
  visibilityScores,
  monitoringResults,
  monitoringQueries,
  recommendations,
  clients,
} from "@/lib/db/schema";
import { eq, and, gte, lt, desc } from "drizzle-orm";

function formatDelta(previous: number | null, current: number): string {
  if (previous === null) return `${current} (first measurement)`;
  if (previous === 0 && current === 0) return "0 → 0";
  const pct = previous > 0
    ? ((current - previous) / previous * 100).toFixed(1)
    : current > 0 ? "+100" : "0";
  const sign = parseFloat(pct) >= 0 ? "+" : "";
  return `${previous} → ${current} (${sign}${pct}%)`;
}
import type { PlatformScores, CompetitorData } from "@/types/monitoring";

export interface AuditMetricsDelta {
  current: number;
  previous: number | null;
  delta: string; // e.g. "62 → 71 (+14.5%)"
}

export interface MonthlyReport {
  clientId: string;
  clientName: string;
  month: string;
  generatedAt: string;
  summary: {
    averageVisibility: number;
    peakVisibility: number;
    totalQueries: number;
    adEquivalentValueInr: number;
    platformBreakdown: PlatformScores;
  };
  trend: Array<{ date: string; score: number }>;
  topCompetitors: CompetitorData[];
  recommendationsSummary: {
    total: number;
    applied: number;
    pending: number;
    rejected: number;
  };
  auditMetrics?: {
    citability: AuditMetricsDelta;
    crawlerAccess: { status: string; blockedCount: number };
    brandAuthority: AuditMetricsDelta;
  };
  highlights: string[];
}

/**
 * Generate a monthly report for a client.
 * Aggregates visibility scores, monitoring results, and recommendations.
 */
export async function generateMonthlyReport(
  clientId: string,
  month: string // format: "2026-03"
): Promise<MonthlyReport> {
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);

  if (!client) throw new Error(`Client not found: ${clientId}`);

  const monthStart = new Date(`${month}-01T00:00:00Z`);
  const nextMonth = new Date(monthStart);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  // Visibility scores for the month
  const scores = await db
    .select()
    .from(visibilityScores)
    .where(
      and(
        eq(visibilityScores.clientId, clientId),
        gte(visibilityScores.date, month + "-01"),
        lt(visibilityScores.date, nextMonth.toISOString().split("T")[0])
      )
    )
    .orderBy(visibilityScores.date);

  const scoreValues = scores.map((s) => parseFloat(s.overallScore ?? "0"));
  const avgScore =
    scoreValues.length > 0
      ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
      : 0;
  const peakScore =
    scoreValues.length > 0 ? Math.round(Math.max(...scoreValues)) : 0;
  const totalAdValue = scores.reduce(
    (sum, s) => sum + parseFloat(s.gadsEquivalentValueInr ?? "0"),
    0
  );

  // Aggregate platform scores from latest entry
  const latestScore = scores[scores.length - 1];
  const platformBreakdown = (latestScore?.platformScores ?? {}) as PlatformScores;

  // Monitoring results count
  const results = await db
    .select({ result: monitoringResults })
    .from(monitoringResults)
    .where(
      and(
        eq(monitoringResults.clientId, clientId),
        gte(monitoringResults.queriedAt, monthStart),
        lt(monitoringResults.queriedAt, nextMonth)
      )
    );

  // Competitor data from latest score
  const competitors = (latestScore?.competitorComparison ?? []) as unknown as CompetitorData[];

  // Recommendations for the month
  const recs = await db
    .select()
    .from(recommendations)
    .where(
      and(
        eq(recommendations.clientId, clientId),
        gte(recommendations.createdAt, monthStart),
        lt(recommendations.createdAt, nextMonth)
      )
    );

  const recsSummary = {
    total: recs.length,
    applied: recs.filter((r) => r.status === "applied").length,
    pending: recs.filter((r) => r.status === "pending").length,
    rejected: recs.filter((r) => r.status === "rejected").length,
  };

  // Extract audit metrics from visibility scores metadata
  let auditMetrics: MonthlyReport["auditMetrics"];
  const latestMeta = (latestScore?.metadata ?? {}) as Record<string, unknown>;
  const currentCitability = (latestMeta.citabilityScore as number) ?? 0;
  const currentBrandAuthority = (latestMeta.brandAuthorityScore as number) ?? 0;
  const crawlerStatus = (latestMeta.crawlerAccessStatus as string) ?? "unknown";
  const crawlerBlocked = (latestMeta.crawlerBlockedCount as number) ?? 0;

  // Get previous month's latest score for delta
  const prevMonthStart = new Date(monthStart);
  prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
  const prevScores = await db
    .select()
    .from(visibilityScores)
    .where(
      and(
        eq(visibilityScores.clientId, clientId),
        gte(visibilityScores.date, prevMonthStart.toISOString().split("T")[0]),
        lt(visibilityScores.date, month + "-01")
      )
    )
    .orderBy(desc(visibilityScores.date))
    .limit(1);

  const prevMeta = (prevScores[0]?.metadata ?? {}) as Record<string, unknown>;
  const prevCitability = prevScores.length > 0 ? ((prevMeta.citabilityScore as number) ?? null) : null;
  const prevBrandAuthority = prevScores.length > 0 ? ((prevMeta.brandAuthorityScore as number) ?? null) : null;

  if (currentCitability > 0 || currentBrandAuthority > 0) {
    auditMetrics = {
      citability: {
        current: currentCitability,
        previous: prevCitability,
        delta: formatDelta(prevCitability, currentCitability),
      },
      crawlerAccess: { status: crawlerStatus, blockedCount: crawlerBlocked },
      brandAuthority: {
        current: currentBrandAuthority,
        previous: prevBrandAuthority,
        delta: formatDelta(prevBrandAuthority, currentBrandAuthority),
      },
    };
  }

  // Generate highlights
  const highlights: string[] = [];
  if (avgScore >= 70) highlights.push("Strong AI visibility this month");
  if (avgScore < 30) highlights.push("AI visibility needs improvement");
  if (recsSummary.applied > 0) {
    highlights.push(`${recsSummary.applied} recommendation(s) applied`);
  }
  if (competitors.length > 0) {
    highlights.push(`${competitors.length} competitors tracked`);
  }
  if (totalAdValue > 0) {
    highlights.push(
      `₹${Math.round(totalAdValue).toLocaleString("en-IN")} equivalent ad value`
    );
  }

  // Audit-specific highlights
  if (auditMetrics) {
    if (prevCitability !== null && currentCitability > prevCitability) {
      const pctChange = Math.round(((currentCitability - prevCitability) / Math.max(prevCitability, 1)) * 100);
      highlights.push(`Citability improved by ${pctChange}%`);
    }
    if (crawlerStatus === "all_allowed") {
      highlights.push("All major AI crawlers allowed");
    } else if (crawlerStatus === "critical_blocked") {
      highlights.push("Critical AI crawlers blocked — immediate action needed");
    }
    if (prevBrandAuthority !== null && currentBrandAuthority > prevBrandAuthority) {
      const pctChange = Math.round(((currentBrandAuthority - prevBrandAuthority) / Math.max(prevBrandAuthority, 1)) * 100);
      highlights.push(`Brand authority up ${pctChange}%`);
    }
  }

  return {
    clientId,
    clientName: client.name,
    month,
    generatedAt: new Date().toISOString(),
    summary: {
      averageVisibility: avgScore,
      peakVisibility: peakScore,
      totalQueries: results.length,
      adEquivalentValueInr: Math.round(totalAdValue),
      platformBreakdown,
    },
    trend: scores.map((s) => ({
      date: s.date,
      score: parseFloat(s.overallScore ?? "0"),
    })),
    topCompetitors: competitors.slice(0, 5),
    recommendationsSummary: recsSummary,
    auditMetrics,
    highlights,
  };
}
