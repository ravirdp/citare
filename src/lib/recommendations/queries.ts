import { db } from "@/lib/db/client";
import { recommendations } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import type {
  RecommendationStatus,
  RecommendationType,
  RecommendationResultData,
} from "./types";

/**
 * Get recommendations for a client, optionally filtered by status/type.
 */
export async function getRecommendations(
  clientId: string,
  filters?: { status?: RecommendationStatus; type?: RecommendationType },
  limit = 50
) {
  const conditions = [eq(recommendations.clientId, clientId)];

  if (filters?.status) {
    conditions.push(
      eq(recommendations.status, filters.status)
    );
  }
  if (filters?.type) {
    conditions.push(eq(recommendations.type, filters.type));
  }

  return db
    .select()
    .from(recommendations)
    .where(and(...conditions))
    .orderBy(desc(recommendations.createdAt))
    .limit(limit);
}

/**
 * Create a new recommendation.
 */
export async function createRecommendation(data: {
  clientId: string;
  generatedBy: string;
  type: string;
  title: string;
  description: string;
  priority?: string;
  actionData?: Record<string, unknown>;
}) {
  const [row] = await db
    .insert(recommendations)
    .values(data)
    .returning();
  return row;
}

/**
 * Update a recommendation's status and optionally its result data.
 */
export async function updateRecommendationStatus(
  id: string,
  status: RecommendationStatus,
  resultData?: RecommendationResultData
) {
  const updates: Record<string, unknown> = { status };
  if (status === "approved" || status === "applied" || status === "rejected") {
    updates.actedOnAt = new Date();
  }
  if (resultData) {
    updates.resultData = resultData;
  }

  const [row] = await db
    .update(recommendations)
    .set(updates)
    .where(eq(recommendations.id, id))
    .returning();
  return row;
}
