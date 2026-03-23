import { db } from "@/lib/db/client";
import { monitoringQueries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getKnowledgeGraph } from "@/lib/knowledge-graph/queries";
import type { KnowledgeGraphData, KGService, KGProduct } from "@/lib/knowledge-graph/types";
import type { GeneratedQuery } from "@/types/monitoring";

/**
 * Generate monitoring queries from a client's knowledge graph.
 * Pure code — no AI dependency.
 */
export async function generateQueriesForClient(
  clientId: string
): Promise<{ generated: number; deactivated: number }> {
  const kgRow = await getKnowledgeGraph(clientId);
  if (!kgRow) {
    throw new Error("Knowledge graph not found. Run synthesis first.");
  }

  const bp = (kgRow.businessProfile ?? {}) as KnowledgeGraphData["businessProfile"];
  const services = (kgRow.services ?? []) as KGService[];
  const products = (kgRow.products ?? []) as KGProduct[];
  const city = bp?.address?.city ?? "";
  const clientName = bp?.name ?? "";

  const queries: GeneratedQuery[] = [];

  // Generate from services
  for (const svc of services) {
    const keywords = svc.keywords ?? [];
    const cpc = svc.cpcData?.averageCpcInr ?? 0;

    // Direct keyword queries
    for (const keyword of keywords) {
      queries.push({
        queryText: city ? `${keyword} in ${city}` : keyword,
        language: "en",
        sourceKeyword: keyword,
        sourceCpcInr: cpc,
        focusItemType: "service",
        focusItemId: svc.id,
      });
    }

    // Recommendation query
    if (svc.name) {
      queries.push({
        queryText: city
          ? `recommend ${svc.name} near ${city}`
          : `recommend ${svc.name}`,
        language: "en",
        sourceKeyword: svc.name,
        sourceCpcInr: cpc,
        focusItemType: "service",
        focusItemId: svc.id,
      });

      // Best-in-city query
      if (city) {
        queries.push({
          queryText: `best ${svc.name} in ${city}`,
          language: "en",
          sourceKeyword: svc.name,
          sourceCpcInr: cpc,
          focusItemType: "service",
          focusItemId: svc.id,
        });
      }
    }

    // Hindi variant if available
    if (svc.multiLang?.hi && city) {
      queries.push({
        queryText: `${svc.multiLang.hi} ${city}`,
        language: "hi",
        sourceKeyword: svc.name,
        sourceCpcInr: cpc,
        focusItemType: "service",
        focusItemId: svc.id,
      });
    }

    // Hinglish variant
    if (svc.multiLang?.hinglish && city) {
      queries.push({
        queryText: `${svc.multiLang.hinglish} ${city} mein`,
        language: "hinglish",
        sourceKeyword: svc.name,
        sourceCpcInr: cpc,
        focusItemType: "service",
        focusItemId: svc.id,
      });
    }
  }

  // Generate from products
  for (const prod of products) {
    const keywords = prod.keywords ?? [];
    const cpc = prod.cpcData?.averageCpcInr ?? 0;

    for (const keyword of keywords.slice(0, 3)) {
      queries.push({
        queryText: city ? `${keyword} in ${city}` : keyword,
        language: "en",
        sourceKeyword: keyword,
        sourceCpcInr: cpc,
        focusItemType: "product",
        focusItemId: prod.id,
      });
    }

    if (prod.name && clientName) {
      queries.push({
        queryText: `${prod.name} from ${clientName}`,
        language: "en",
        sourceKeyword: prod.name,
        sourceCpcInr: cpc,
        focusItemType: "product",
        focusItemId: prod.id,
      });
    }
  }

  // Deduplicate by queryText
  const seen = new Set<string>();
  const uniqueQueries = queries.filter((q) => {
    const key = q.queryText.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Deactivate old queries
  const deactivated = await db
    .update(monitoringQueries)
    .set({ isActive: false })
    .where(eq(monitoringQueries.clientId, clientId))
    .returning();

  // Insert new queries
  if (uniqueQueries.length > 0) {
    await db.insert(monitoringQueries).values(
      uniqueQueries.map((q) => ({
        clientId,
        queryText: q.queryText,
        language: q.language,
        sourceKeyword: q.sourceKeyword,
        sourceCpcInr: String(q.sourceCpcInr),
        focusItemType: q.focusItemType,
        focusItemId: q.focusItemId,
        isActive: true,
      }))
    );
  }

  return {
    generated: uniqueQueries.length,
    deactivated: deactivated.length,
  };
}
