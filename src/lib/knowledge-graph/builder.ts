import { db } from "@/lib/db/client";
import { knowledgeGraphs, knowledgeGraphHistory } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { KnowledgeGraphData } from "./types";

/**
 * Create a new knowledge graph for a client.
 * Returns the created knowledge graph row.
 */
export async function createKnowledgeGraph(
  clientId: string,
  data: KnowledgeGraphData
) {
  return db.transaction(async (tx) => {
    const [kg] = await tx
      .insert(knowledgeGraphs)
      .values({
        clientId,
        version: 1,
        businessProfile: data.businessProfile,
        services: data.services,
        products: data.products,
        competitors: data.competitors,
        presenceState: data.presenceState,
        searchState: data.searchState,
        decisionRadiusMap: data.decisionRadiusMap,
        confidenceScores: data.confidenceScores,
        conflicts: data.conflicts,
        lastStrategistRun: new Date(),
      })
      .returning();

    // Create initial history entry
    await tx.insert(knowledgeGraphHistory).values({
      knowledgeGraphId: kg.id,
      version: 1,
      snapshot: data as unknown as Record<string, unknown>,
      changedBy: "tier_one",
      changeReason: "Initial knowledge graph synthesis",
    });

    return kg;
  });
}

/**
 * Update an existing knowledge graph.
 * Snapshots the current state to history before applying updates.
 */
export async function updateKnowledgeGraph(
  knowledgeGraphId: string,
  updates: Partial<KnowledgeGraphData>,
  changedBy: string,
  changeReason: string
) {
  return db.transaction(async (tx) => {
    // Fetch current state
    const [current] = await tx
      .select()
      .from(knowledgeGraphs)
      .where(eq(knowledgeGraphs.id, knowledgeGraphId))
      .limit(1);

    if (!current) {
      throw new Error(`Knowledge graph not found: ${knowledgeGraphId}`);
    }

    const currentVersion = current.version ?? 1;
    const newVersion = currentVersion + 1;

    // Snapshot current state to history
    const snapshot: KnowledgeGraphData = {
      businessProfile: current.businessProfile as KnowledgeGraphData["businessProfile"],
      services: current.services as KnowledgeGraphData["services"],
      products: current.products as KnowledgeGraphData["products"],
      competitors: current.competitors as KnowledgeGraphData["competitors"],
      presenceState: current.presenceState as KnowledgeGraphData["presenceState"],
      searchState: current.searchState as KnowledgeGraphData["searchState"],
      decisionRadiusMap: current.decisionRadiusMap as KnowledgeGraphData["decisionRadiusMap"],
      confidenceScores: current.confidenceScores as KnowledgeGraphData["confidenceScores"],
      conflicts: current.conflicts as KnowledgeGraphData["conflicts"],
    };

    await tx.insert(knowledgeGraphHistory).values({
      knowledgeGraphId,
      version: currentVersion,
      snapshot: snapshot as unknown as Record<string, unknown>,
      changedBy,
      changeReason,
    });

    // Apply updates
    const updateFields: Record<string, unknown> = {
      version: newVersion,
      updatedAt: new Date(),
    };

    if (updates.businessProfile !== undefined) updateFields.businessProfile = updates.businessProfile;
    if (updates.services !== undefined) updateFields.services = updates.services;
    if (updates.products !== undefined) updateFields.products = updates.products;
    if (updates.competitors !== undefined) updateFields.competitors = updates.competitors;
    if (updates.presenceState !== undefined) updateFields.presenceState = updates.presenceState;
    if (updates.searchState !== undefined) updateFields.searchState = updates.searchState;
    if (updates.decisionRadiusMap !== undefined) updateFields.decisionRadiusMap = updates.decisionRadiusMap;
    if (updates.confidenceScores !== undefined) updateFields.confidenceScores = updates.confidenceScores;
    if (updates.conflicts !== undefined) updateFields.conflicts = updates.conflicts;

    if (changedBy === "tier_one") {
      updateFields.lastStrategistRun = new Date();
    } else if (changedBy === "tier_two") {
      updateFields.lastWorkerRun = new Date();
    }

    const [updated] = await tx
      .update(knowledgeGraphs)
      .set(updateFields)
      .where(eq(knowledgeGraphs.id, knowledgeGraphId))
      .returning();

    return updated;
  });
}

/**
 * Rollback a knowledge graph to a previous version.
 */
export async function rollbackKnowledgeGraph(
  knowledgeGraphId: string,
  targetVersion: number
) {
  // Fetch the target snapshot
  const [historyEntry] = await db
    .select()
    .from(knowledgeGraphHistory)
    .where(
      and(
        eq(knowledgeGraphHistory.knowledgeGraphId, knowledgeGraphId),
        eq(knowledgeGraphHistory.version, targetVersion)
      )
    )
    .limit(1);

  if (!historyEntry) {
    throw new Error(
      `Version ${targetVersion} not found for knowledge graph ${knowledgeGraphId}`
    );
  }

  const snapshot = historyEntry.snapshot as unknown as KnowledgeGraphData;

  return updateKnowledgeGraph(
    knowledgeGraphId,
    snapshot,
    "manual",
    `Rollback to version ${targetVersion}`
  );
}
