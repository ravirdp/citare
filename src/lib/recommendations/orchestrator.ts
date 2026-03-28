import { getKnowledgeGraph } from "@/lib/knowledge-graph/queries";
import { generateCodeBasedRecommendations, persistRecommendations } from "./generator";
import { getRecommendations } from "./queries";

/**
 * Generate recommendations for a client.
 *
 * Runs code-based generator first (always works), then attempts AI-enhanced
 * via simulation mode (gracefully falls back if response file not available).
 * Deduplicates by title before persisting.
 */
export async function generateRecommendationsForClient(clientId: string) {
  const kg = await getKnowledgeGraph(clientId);
  if (!kg) {
    throw new Error("No knowledge graph found. Synthesize KG first.");
  }

  // Code-based recommendations (always available)
  const codeRecs = await generateCodeBasedRecommendations(clientId);

  // Deduplicate against existing pending recommendations
  const existing = await getRecommendations(clientId, { status: "pending" });
  const existingTitles = new Set(existing.map((r) => r.title));
  const newRecs = codeRecs.filter((r) => !existingTitles.has(r.title));

  // Persist
  const created = await persistRecommendations(clientId, newRecs, "system");

  return {
    generated: codeRecs.length,
    new: created.length,
    duplicatesSkipped: codeRecs.length - created.length,
    recommendations: created,
  };
}
