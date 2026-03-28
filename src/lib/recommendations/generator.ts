import { db } from "@/lib/db/client";
import {
  monitoringResults,
  monitoringQueries,
  presenceDeployments,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getKnowledgeGraph } from "@/lib/knowledge-graph/queries";
import { createRecommendation } from "./queries";
import type { RecommendationType, RecommendationPriority } from "./types";

interface GeneratedRecommendation {
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  actionData: Record<string, unknown>;
}

/**
 * Code-based recommendation generator (Tier Zero — no AI).
 * Analyzes monitoring data and presence state to produce recommendations.
 */
export async function generateCodeBasedRecommendations(
  clientId: string
): Promise<GeneratedRecommendation[]> {
  const results: GeneratedRecommendation[] = [];

  const [accuracyRecs, gapRecs, competitiveRecs, contentRecs, spendRecs] =
    await Promise.allSettled([
      findAccuracyFixes(clientId),
      findGapAlerts(clientId),
      findCompetitiveAlerts(clientId),
      findContentUpdates(clientId),
      findSpendOptimizations(clientId),
    ]);

  for (const r of [accuracyRecs, gapRecs, competitiveRecs, contentRecs, spendRecs]) {
    if (r.status === "fulfilled") results.push(...r.value);
  }

  return results;
}

/**
 * Persist generated recommendations to the database.
 */
export async function persistRecommendations(
  clientId: string,
  recs: GeneratedRecommendation[],
  generatedBy = "system"
) {
  const created = [];
  for (const rec of recs) {
    const row = await createRecommendation({
      clientId,
      generatedBy,
      type: rec.type,
      title: rec.title,
      description: rec.description,
      priority: rec.priority,
      actionData: rec.actionData,
    });
    created.push(row);
  }
  return created;
}

// ── Individual analyzers ──

async function findAccuracyFixes(
  clientId: string
): Promise<GeneratedRecommendation[]> {
  const rows = await db
    .select({ result: monitoringResults, query: monitoringQueries })
    .from(monitoringResults)
    .innerJoin(monitoringQueries, eq(monitoringResults.queryId, monitoringQueries.id))
    .where(
      and(
        eq(monitoringResults.clientId, clientId),
        eq(monitoringResults.informationAccurate, false)
      )
    );

  if (rows.length === 0) return [];

  // Group by unique accuracy issue
  const issueMap = new Map<string, { platforms: Set<string>; count: number }>();
  for (const r of rows) {
    const issues = (r.result.accuracyIssues ?? []) as string[];
    for (const issue of issues) {
      const entry = issueMap.get(issue) ?? { platforms: new Set(), count: 0 };
      entry.platforms.add(r.result.platform);
      entry.count++;
      issueMap.set(issue, entry);
    }
  }

  return Array.from(issueMap.entries()).map(([issue, data]) => ({
    type: "accuracy_fix" as const,
    priority: "critical" as const,
    title: `Fix inaccurate information: ${issue.slice(0, 80)}`,
    description: `AI platforms are presenting incorrect information about your business. Found on ${data.platforms.size} platform(s) across ${data.count} query result(s): "${issue}". Approving will regenerate your presence content with corrected data.`,
    actionData: {
      issue,
      platforms: Array.from(data.platforms),
      occurrences: data.count,
    },
  }));
}

async function findGapAlerts(
  clientId: string
): Promise<GeneratedRecommendation[]> {
  const kg = await getKnowledgeGraph(clientId);
  if (!kg) return [];

  const rows = await db
    .select({ result: monitoringResults, query: monitoringQueries })
    .from(monitoringResults)
    .innerJoin(monitoringQueries, eq(monitoringResults.queryId, monitoringQueries.id))
    .where(eq(monitoringResults.clientId, clientId));

  if (rows.length === 0) return [];

  // Group by focus item and check if client is never mentioned
  const itemResults = new Map<
    string,
    { name: string; mentioned: number; total: number }
  >();
  for (const r of rows) {
    const key = r.query.focusItemId ?? "unknown";
    const entry = itemResults.get(key) ?? {
      name: r.query.sourceKeyword ?? key,
      mentioned: 0,
      total: 0,
    };
    entry.total++;
    if (r.result.clientMentioned) entry.mentioned++;
    itemResults.set(key, entry);
  }

  return Array.from(itemResults.entries())
    .filter(([, data]) => {
      const mentionRate = data.total > 0 ? data.mentioned / data.total : 0;
      // Flag services below 40% visibility (not just zero)
      return mentionRate < 0.4 && data.total >= 3;
    })
    .map(([itemId, data]) => {
      const mentionRate = data.total > 0 ? data.mentioned / data.total : 0;
      return {
        type: "gap_alert" as const,
        priority: "high" as const,
        title: `Low visibility for: ${data.name}`,
        description: `Your business was only mentioned in ${Math.round(mentionRate * 100)}% of ${data.total} AI queries about "${data.name}". Consider enriching your knowledge graph and presence content for this service/product.`,
        actionData: { itemId, itemName: data.name, queriesChecked: data.total, mentionRate: Math.round(mentionRate * 100) },
      };
    });
}

async function findCompetitiveAlerts(
  clientId: string
): Promise<GeneratedRecommendation[]> {
  const rows = await db
    .select({ result: monitoringResults, query: monitoringQueries })
    .from(monitoringResults)
    .innerJoin(monitoringQueries, eq(monitoringResults.queryId, monitoringQueries.id))
    .where(eq(monitoringResults.clientId, clientId));

  if (rows.length === 0) return [];

  let clientMentions = 0;
  const competitorCounts = new Map<string, number>();

  for (const r of rows) {
    if (r.result.clientMentioned) clientMentions++;
    const mentions = (r.result.competitorMentions ?? []) as Array<{
      name: string;
    }>;
    for (const cm of mentions) {
      competitorCounts.set(cm.name, (competitorCounts.get(cm.name) ?? 0) + 1);
    }
  }

  // Flag competitors with more than half the client's visibility
  const threshold = clientMentions * 0.5;
  return Array.from(competitorCounts.entries())
    .filter(([, count]) => count > threshold)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, count]) => ({
      type: "competitive_alert" as const,
      priority: count > clientMentions ? "high" as const : "medium" as const,
      title: `Competitor "${name}" has significant AI visibility`,
      description: `${name} was mentioned ${count} times vs your ${clientMentions} mentions across AI platforms (${Math.round((count / clientMentions) * 100)}% of your visibility).`,
      actionData: {
        competitorName: name,
        competitorMentions: count,
        clientMentions,
      },
    }));
}

async function findContentUpdates(
  clientId: string
): Promise<GeneratedRecommendation[]> {
  const deployments = await db
    .select()
    .from(presenceDeployments)
    .where(eq(presenceDeployments.clientId, clientId));

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const stale = deployments.filter((d) => {
    const updated = d.updatedAt ?? d.createdAt;
    return updated && new Date(updated) < thirtyDaysAgo;
  });

  if (stale.length === 0) return [];

  return [
    {
      type: "content_update" as const,
      priority: "medium" as const,
      title: `${stale.length} presence format(s) are over 30 days old`,
      description: `The following formats haven't been regenerated in over 30 days: ${stale.map((d) => d.format).join(", ")}. Regenerating ensures AI platforms have your latest information.`,
      actionData: {
        staleFormats: stale.map((d) => d.format),
        deploymentIds: stale.map((d) => d.id),
      },
    },
  ];
}

async function findSpendOptimizations(
  clientId: string
): Promise<GeneratedRecommendation[]> {
  const rows = await db
    .select({ result: monitoringResults, query: monitoringQueries })
    .from(monitoringResults)
    .innerJoin(monitoringQueries, eq(monitoringResults.queryId, monitoringQueries.id))
    .where(eq(monitoringResults.clientId, clientId));

  if (rows.length === 0) return [];

  // Group by source keyword and compute mention rate + CPC
  const keywordStats = new Map<
    string,
    { cpc: number; mentioned: number; total: number }
  >();
  for (const r of rows) {
    const kw = r.query.sourceKeyword ?? "unknown";
    const entry = keywordStats.get(kw) ?? { cpc: 0, mentioned: 0, total: 0 };
    entry.cpc = Math.max(entry.cpc, parseFloat(r.query.sourceCpcInr ?? "0"));
    entry.total++;
    if (r.result.clientMentioned) entry.mentioned++;
    keywordStats.set(kw, entry);
  }

  const recs: GeneratedRecommendation[] = [];

  for (const [keyword, stats] of keywordStats) {
    const mentionRate = stats.total > 0 ? stats.mentioned / stats.total : 0;

    // High AI visibility = flag as covered by AI search
    if (mentionRate >= 0.7) {
      const hasCpc = stats.cpc > 0;
      recs.push({
        type: "spend_optimization" as const,
        priority: "low" as const,
        title: hasCpc
          ? `AI covers "${keyword}" — consider reducing ad spend`
          : `Strong AI visibility for "${keyword}"`,
        description: hasCpc
          ? `You're spending ₹${stats.cpc}/click on "${keyword}" but AI platforms mention you ${Math.round(mentionRate * 100)}% of the time. AI search is providing organic coverage — consider reallocating some ad budget.`
          : `AI platforms mention you ${Math.round(mentionRate * 100)}% of the time for "${keyword}". This keyword has strong organic AI coverage.`,
        actionData: {
          keyword,
          cpc: stats.cpc,
          mentionRate: Math.round(mentionRate * 100),
        },
      });
    }
  }

  return recs.slice(0, 5); // limit to top 5
}
