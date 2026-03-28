import { db } from "@/lib/db/client";
import {
  monitoringResults,
  monitoringQueries,
  visibilityScores,
} from "@/lib/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import type { PlatformScores, ItemScore, CompetitorData } from "@/types/monitoring";
import { ALL_PLATFORMS } from "@/types/monitoring";
import { recomputeAuditMetrics } from "@/lib/analysis/recurring-audit";

// Score weights
const MENTION_WEIGHT = 0.5;
const POSITION_WEIGHT = 0.3;
const ACCURACY_WEIGHT = 0.2;

/**
 * Compute visibility score for a client on a given date.
 */
export async function computeVisibilityScore(
  clientId: string,
  date: string
): Promise<{
  overallScore: number;
  platformScores: PlatformScores;
  itemScores: ItemScore[];
  adEquivalentValueInr: number;
  competitors: CompetitorData[];
}> {
  const dayStart = new Date(`${date}T00:00:00Z`);
  const dayEnd = new Date(`${date}T23:59:59Z`);

  // Load day's results with their queries (for focus item info)
  const results = await db
    .select({
      result: monitoringResults,
      query: monitoringQueries,
    })
    .from(monitoringResults)
    .innerJoin(
      monitoringQueries,
      eq(monitoringResults.queryId, monitoringQueries.id)
    )
    .where(
      and(
        eq(monitoringResults.clientId, clientId),
        gte(monitoringResults.queriedAt, dayStart),
        lt(monitoringResults.queriedAt, dayEnd)
      )
    );

  if (results.length === 0) {
    // No results for this day — look for any results (simulation may not have date filtering)
    const allResults = await db
      .select({
        result: monitoringResults,
        query: monitoringQueries,
      })
      .from(monitoringResults)
      .innerJoin(
        monitoringQueries,
        eq(monitoringResults.queryId, monitoringQueries.id)
      )
      .where(eq(monitoringResults.clientId, clientId));

    if (allResults.length > 0) {
      return computeFromResults(allResults, clientId, date);
    }

    return {
      overallScore: 0,
      platformScores: {},
      itemScores: [],
      adEquivalentValueInr: 0,
      competitors: [],
    };
  }

  return computeFromResults(results, clientId, date);
}

async function computeFromResults(
  results: Array<{
    result: typeof monitoringResults.$inferSelect;
    query: typeof monitoringQueries.$inferSelect;
  }>,
  clientId: string,
  date: string
) {
  // Overall score
  const overallScore = computeScore(results.map((r) => r.result));

  // Per-platform scores
  const platformScores: PlatformScores = {};
  for (const platform of ALL_PLATFORMS) {
    const platformResults = results.filter(
      (r) => r.result.platform === platform
    );
    if (platformResults.length > 0) {
      platformScores[platform] = computeScore(
        platformResults.map((r) => r.result)
      );
    }
  }

  // Per-item scores
  const itemGroups = new Map<
    string,
    typeof results
  >();
  for (const r of results) {
    const key = `${r.query.focusItemType}:${r.query.focusItemId}`;
    if (!itemGroups.has(key)) itemGroups.set(key, []);
    itemGroups.get(key)!.push(r);
  }

  const itemScores: ItemScore[] = [];
  for (const [key, groupResults] of itemGroups) {
    const [type, id] = key.split(":");
    const itemPlatformScores: PlatformScores = {};
    for (const platform of ALL_PLATFORMS) {
      const pr = groupResults.filter(
        (r) => r.result.platform === platform
      );
      if (pr.length > 0) {
        itemPlatformScores[platform] = computeScore(pr.map((r) => r.result));
      }
    }

    itemScores.push({
      itemId: id,
      itemName: groupResults[0].query.sourceKeyword ?? id,
      itemType: (type as "service" | "product") ?? "service",
      score: computeScore(groupResults.map((r) => r.result)),
      platforms: itemPlatformScores,
    });
  }

  // Ad equivalent value
  let adEquivalentValueInr = 0;
  for (const r of results) {
    if (r.result.clientMentioned && r.query.sourceCpcInr) {
      adEquivalentValueInr += parseFloat(r.query.sourceCpcInr);
    }
  }

  // Competitor analysis
  const competitorMap = new Map<
    string,
    { mentions: number; positions: number[]; platforms: Map<string, number> }
  >();
  for (const r of results) {
    const mentions = (r.result.competitorMentions ?? []) as Array<{
      name: string;
      position: number | null;
    }>;
    for (const cm of mentions) {
      if (!competitorMap.has(cm.name)) {
        competitorMap.set(cm.name, {
          mentions: 0,
          positions: [],
          platforms: new Map(),
        });
      }
      const entry = competitorMap.get(cm.name)!;
      entry.mentions++;
      if (cm.position) entry.positions.push(cm.position);
      const platformCount =
        entry.platforms.get(r.result.platform) ?? 0;
      entry.platforms.set(r.result.platform, platformCount + 1);
    }
  }

  const competitors: CompetitorData[] = Array.from(competitorMap.entries())
    .map(([name, data]) => ({
      name,
      totalMentions: data.mentions,
      avgPosition:
        data.positions.length > 0
          ? Math.round(
              (data.positions.reduce((a, b) => a + b, 0) /
                data.positions.length) *
                10
            ) / 10
          : 0,
      platformBreakdown: Object.fromEntries(data.platforms) as PlatformScores,
    }))
    .sort((a, b) => b.totalMentions - a.totalMentions);

  // Compute audit metrics (citability, crawler access, brand authority)
  let auditMetadata: Record<string, unknown> = {};
  try {
    const auditMetrics = await recomputeAuditMetrics(clientId);
    auditMetadata = auditMetrics as unknown as Record<string, unknown>;
  } catch (err) {
    console.error("[Scoring] Audit metrics computation failed:", err);
  }

  // Upsert visibility score
  const existing = await db
    .select()
    .from(visibilityScores)
    .where(
      and(
        eq(visibilityScores.clientId, clientId),
        eq(visibilityScores.date, date)
      )
    )
    .limit(1);

  const scoreData = {
    overallScore: String(Math.round(overallScore)),
    platformScores: platformScores as unknown as Record<string, unknown>,
    itemScores: itemScores as unknown as Record<string, unknown>,
    gadsEquivalentValueInr: String(Math.round(adEquivalentValueInr)),
    competitorComparison: competitors as unknown as Record<string, unknown>,
    metadata: auditMetadata,
  };

  if (existing.length > 0) {
    await db
      .update(visibilityScores)
      .set(scoreData)
      .where(eq(visibilityScores.id, existing[0].id));
  } else {
    await db.insert(visibilityScores).values({
      clientId,
      date,
      ...scoreData,
    });
  }

  return {
    overallScore: Math.round(overallScore),
    platformScores,
    itemScores,
    adEquivalentValueInr: Math.round(adEquivalentValueInr),
    competitors,
  };
}

function computeScore(
  results: Array<typeof monitoringResults.$inferSelect>
): number {
  if (results.length === 0) return 0;

  const mentioned = results.filter((r) => r.clientMentioned);
  const mentionRate = (mentioned.length / results.length) * 100;

  let positionScore = 0;
  if (mentioned.length > 0) {
    const posScores = mentioned.map((r) => {
      const pos = r.clientPosition ?? 5;
      return ((6 - Math.min(pos, 5)) / 5) * 100;
    });
    positionScore =
      posScores.reduce((a, b) => a + b, 0) / posScores.length;
  }

  const accurateCount = mentioned.filter(
    (r) => r.informationAccurate
  ).length;
  const accuracyScore =
    mentioned.length > 0
      ? (accurateCount / mentioned.length) * 100
      : 100;

  return (
    mentionRate * MENTION_WEIGHT +
    positionScore * POSITION_WEIGHT +
    accuracyScore * ACCURACY_WEIGHT
  );
}
