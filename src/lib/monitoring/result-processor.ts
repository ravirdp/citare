import { db } from "@/lib/db/client";
import { monitoringResults } from "@/lib/db/schema";
import { eq, isNull } from "drizzle-orm";
import { getKnowledgeGraph } from "@/lib/knowledge-graph/queries";
import type { KnowledgeGraphData } from "@/lib/knowledge-graph/types";

/**
 * Process unprocessed monitoring results for a client.
 * Code-based parsing — no AI dependency.
 */
export async function processResultsBatch(
  clientId: string
): Promise<{ processed: number }> {
  // Load unprocessed results (responseSummary IS NULL)
  const unprocessed = await db
    .select()
    .from(monitoringResults)
    .where(eq(monitoringResults.clientId, clientId));

  const toProcess = unprocessed.filter((r) => !r.responseSummary);

  if (toProcess.length === 0) {
    return { processed: 0 };
  }

  // Load KG for accuracy checking
  const kgRow = await getKnowledgeGraph(clientId);
  const bp = kgRow
    ? ((kgRow.businessProfile ?? {}) as KnowledgeGraphData["businessProfile"])
    : null;

  let processed = 0;

  for (const result of toProcess) {
    try {
      const raw = result.rawResponse ?? "";
      const competitors = (result.competitorMentions ?? []) as Array<{
        name: string;
        position: number | null;
      }>;

      // Build summary
      const parts: string[] = [];
      if (result.clientMentioned) {
        parts.push(
          `Client mentioned${result.clientPosition ? ` at position ${result.clientPosition}` : ""}.`
        );
      } else {
        parts.push("Client not mentioned.");
      }

      if (competitors.length > 0) {
        parts.push(
          `Competitors: ${competitors.map((c) => c.name).join(", ")}.`
        );
      }

      // Accuracy check against KG
      const accuracyIssues: string[] = [];
      if (result.clientMentioned && bp) {
        // Check if response contains wrong info
        const rawLower = raw.toLowerCase();
        if (
          bp.contact?.phone &&
          rawLower.includes("phone") &&
          !rawLower.includes(bp.contact.phone)
        ) {
          accuracyIssues.push("Phone number may be incorrect");
        }
        if (
          bp.address?.city &&
          rawLower.includes("located") &&
          !rawLower.includes(bp.address.city.toLowerCase())
        ) {
          accuracyIssues.push("Location information may be inaccurate");
        }
      }

      // Merge with existing accuracy issues
      const existingIssues = (result.accuracyIssues ?? []) as string[];
      const allIssues = [...new Set([...existingIssues, ...accuracyIssues])];

      if (allIssues.length > 0) {
        parts.push(`Issues: ${allIssues.join("; ")}.`);
      }

      await db
        .update(monitoringResults)
        .set({
          responseSummary: parts.join(" "),
          accuracyIssues: allIssues,
          informationAccurate: allIssues.length === 0,
        })
        .where(eq(monitoringResults.id, result.id));

      processed++;
    } catch (err) {
      console.error(`Result processing error [${result.id}]:`, err);
    }
  }

  return { processed };
}
