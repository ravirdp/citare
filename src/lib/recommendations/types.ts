import type { recommendations } from "@/lib/db/schema";

// Inferred DB row type
export type Recommendation = typeof recommendations.$inferSelect;
export type NewRecommendation = typeof recommendations.$inferInsert;

export type RecommendationType =
  | "content_update"
  | "gap_alert"
  | "competitive_alert"
  | "accuracy_fix"
  | "spend_optimization";

export type RecommendationPriority = "critical" | "high" | "medium" | "low";

export type RecommendationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "applied";

export interface RecommendationActionData {
  targetFormat?: string;
  targetField?: string;
  suggestedContent?: string;
  affectedItemIds?: string[];
  affectedPlatforms?: string[];
  competitorName?: string;
  currentCpc?: number;
  visibilityScore?: number;
}

export interface RecommendationResultData {
  appliedAt?: string;
  presenceFormatsRegenerated?: string[];
  beforeScore?: number;
  afterScore?: number;
  error?: string;
}
