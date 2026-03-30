import { db } from "@/lib/db/client";
import { monitoringQueries, monitoringResults, clients, knowledgeGraphs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getActivePlatforms } from "./platforms";
import { getSubscriptionForClient } from "@/lib/billing/guards";

interface RunResult {
  queriesRun: number;
  resultsStored: number;
  errors: number;
  platformBreakdown: Record<string, { success: number; errors: number }>;
}

/**
 * Run monitoring for a single client: all active queries × all platforms.
 */
export async function runMonitoringForClient(
  clientId: string
): Promise<RunResult> {
  // Load client name for mention detection
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);

  if (!client) {
    throw new Error(`Client not found: ${clientId}`);
  }

  // Check subscription status
  const sub = await getSubscriptionForClient(clientId);
  if (!sub) {
    throw new Error("No subscription found. Monitoring skipped.");
  }

  const isActive = sub.status === "active" || (sub.status === "trialing" && (!sub.trialEnd || sub.trialEnd.getTime() > Date.now()));
  if (!isActive) {
    throw new Error(`Subscription ${sub.status}. Monitoring skipped.`);
  }

  // Check monitoring frequency
  if (sub.monitoringFrequency === "every_3_days") {
    const [lastResult] = await db
      .select({ queriedAt: monitoringResults.queriedAt })
      .from(monitoringResults)
      .where(eq(monitoringResults.clientId, clientId))
      .orderBy(desc(monitoringResults.queriedAt))
      .limit(1);

    if (lastResult?.queriedAt) {
      const hoursSince = (Date.now() - lastResult.queriedAt.getTime()) / 3600000;
      if (hoursSince < 72) {
        throw new Error(`Monitoring frequency: every 3 days. Last run ${Math.floor(hoursSince)}h ago. Skipped.`);
      }
    }
  }

  const bp = (client.metadata as Record<string, unknown>) ?? {};
  const clientName = client.name ?? (bp as { name?: string }).name ?? "";

  // Load competitor names from knowledge graph for mention detection
  let competitorNames: string[] = [];
  try {
    const [kg] = await db
      .select()
      .from(knowledgeGraphs)
      .where(eq(knowledgeGraphs.clientId, clientId))
      .orderBy(desc(knowledgeGraphs.version))
      .limit(1);

    if (kg?.competitors) {
      const competitors = kg.competitors as Array<{ name?: string }> | undefined;
      if (Array.isArray(competitors)) {
        competitorNames = competitors
          .map((c) => c.name)
          .filter((n): n is string => !!n);
      }
    }
  } catch {
    // KG unavailable — proceed without competitor names
  }

  // Load active queries
  const queries = await db
    .select()
    .from(monitoringQueries)
    .where(eq(monitoringQueries.clientId, clientId));

  const activeQueries = queries.filter((q) => q.isActive);

  if (activeQueries.length === 0) {
    throw new Error("No active monitoring queries. Generate queries first.");
  }

  const platforms = getActivePlatforms();
  const platformBreakdown: Record<string, { success: number; errors: number }> = {};
  let totalResults = 0;
  let totalErrors = 0;

  // Process one platform at a time (sequential for RAM constraint)
  for (const adapter of platforms) {
    const stats = { success: 0, errors: 0 };

    // All queries for this platform in parallel with error isolation
    const results = await Promise.allSettled(
      activeQueries.map(async (query) => {
        const result = await adapter.queryPlatform(query.queryText, clientName, competitorNames);

        await db.insert(monitoringResults).values({
          clientId,
          queryId: query.id,
          platform: adapter.platform,
          clientMentioned: result.clientMentioned,
          clientPosition: result.clientPosition,
          informationAccurate: result.informationAccurate,
          accuracyIssues: result.accuracyIssues,
          competitorMentions: result.competitorMentions,
          rawResponse: result.rawResponse,
          responseSummary: result.responseSummary,
          queryMethod: result.queryMethod,
          responseTimeMs: result.responseTimeMs,
        });

        return result;
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled") {
        stats.success++;
        totalResults++;
      } else {
        stats.errors++;
        totalErrors++;
        console.error(
          `Monitor error [${adapter.platform}]:`,
          r.reason
        );
      }
    }

    platformBreakdown[adapter.platform] = stats;
  }

  return {
    queriesRun: activeQueries.length,
    resultsStored: totalResults,
    errors: totalErrors,
    platformBreakdown,
  };
}

/**
 * Run monitoring for all active clients.
 */
export async function runMonitoringForAll(): Promise<{
  clientsProcessed: number;
  totalResults: number;
  errors: Array<{ clientId: string; error: string }>;
}> {
  const allClients = await db
    .select()
    .from(clients)
    .where(eq(clients.status, "active"));

  let totalResults = 0;
  const errors: Array<{ clientId: string; error: string }> = [];

  // Sequential per client (RAM constraint)
  for (const client of allClients) {
    try {
      const result = await runMonitoringForClient(client.id);
      totalResults += result.resultsStored;
    } catch (err) {
      errors.push({
        clientId: client.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    clientsProcessed: allClients.length,
    totalResults,
    errors,
  };
}
