import { db } from "@/lib/db/client";
import { knowledgeGraphs, knowledgeGraphHistory } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Get the current knowledge graph for a client.
 */
export async function getKnowledgeGraph(clientId: string) {
  const [kg] = await db
    .select()
    .from(knowledgeGraphs)
    .where(eq(knowledgeGraphs.clientId, clientId))
    .limit(1);

  return kg ?? null;
}

/**
 * Get version history for a knowledge graph.
 */
export async function getKnowledgeGraphHistory(
  knowledgeGraphId: string,
  limit = 20
) {
  return db
    .select()
    .from(knowledgeGraphHistory)
    .where(eq(knowledgeGraphHistory.knowledgeGraphId, knowledgeGraphId))
    .orderBy(desc(knowledgeGraphHistory.version))
    .limit(limit);
}

/**
 * Get a specific version snapshot from history.
 */
export async function getKnowledgeGraphVersion(
  knowledgeGraphId: string,
  version: number
) {
  const [entry] = await db
    .select()
    .from(knowledgeGraphHistory)
    .where(
      and(
        eq(knowledgeGraphHistory.knowledgeGraphId, knowledgeGraphId),
        eq(knowledgeGraphHistory.version, version)
      )
    )
    .limit(1);

  return entry ?? null;
}
