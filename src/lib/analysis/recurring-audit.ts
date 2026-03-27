/**
 * Recurring Audit Metrics — Recomputes audit metrics for a client
 * and returns a structured object to store in visibility_scores.metadata.
 *
 * Called during every visibility score computation and after presence
 * regeneration in the feedback loop.
 */

import { db } from "@/lib/db/client";
import { presenceDeployments, clients, knowledgeGraphs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { analyzeContentCitability } from "./citability";
import { analyzeCrawlerAccess } from "./crawler-access";
import { scanBrandMentions } from "./brand-mentions";

export interface AuditMetrics {
  citabilityScore: number;
  crawlerAccessStatus: string; // "all_allowed" | "some_blocked" | "critical_blocked"
  crawlerBlockedCount: number;
  crawlerCriticalCount: number;
  brandAuthorityScore: number;
  computedAt: string;
}

export async function recomputeAuditMetrics(clientId: string): Promise<AuditMetrics> {
  // 1. Citability — score latest deployed presence content
  const deployments = await db
    .select()
    .from(presenceDeployments)
    .where(eq(presenceDeployments.clientId, clientId));

  let citabilityScore = 0;
  const contentDeployments = deployments.filter((d) => d.content && d.content.length > 0);
  if (contentDeployments.length > 0) {
    const scores = contentDeployments.map((d) => {
      const result = analyzeContentCitability(d.content!);
      return result.averageScore;
    });
    citabilityScore = Math.round(
      (scores.reduce((a, b) => a + b, 0) / scores.length) * 10
    ) / 10;
  }

  // 2. Crawler access — check robots.txt
  let crawlerAccessStatus = "all_allowed";
  let crawlerBlockedCount = 0;
  let crawlerCriticalCount = 0;

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);

  if (client) {
    const [kg] = await db
      .select()
      .from(knowledgeGraphs)
      .where(eq(knowledgeGraphs.clientId, clientId))
      .limit(1);

    const profile = kg?.businessProfile as Record<string, unknown> | null;
    const website = (profile?.website as string)
      ?? (profile?.domain as string)
      ?? ((client.metadata as Record<string, unknown>)?.website as string);

    if (website) {
      let domain: string;
      try {
        const url = website.startsWith("http") ? website : `https://${website}`;
        domain = new URL(url).hostname;
      } catch {
        domain = website.replace(/^https?:\/\//, "").split("/")[0];
      }

      const report = await analyzeCrawlerAccess(domain);
      crawlerAccessStatus = report.overallStatus;
      crawlerBlockedCount = report.blockedCount;
      crawlerCriticalCount = report.criticalCount;
    }
  }

  // 3. Brand authority
  let brandAuthorityScore = 0;
  if (client) {
    const result = await scanBrandMentions(client.name);
    brandAuthorityScore = result.overallScore;
  }

  return {
    citabilityScore,
    crawlerAccessStatus,
    crawlerBlockedCount,
    crawlerCriticalCount,
    brandAuthorityScore,
    computedAt: new Date().toISOString(),
  };
}
