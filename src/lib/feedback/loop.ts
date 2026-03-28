import { isCooldownActive, setCooldown } from "@/lib/knowledge-graph/cooldown";
import { computeVisibilityScore } from "@/lib/monitoring/scoring";
import { generateRecommendationsForClient } from "@/lib/recommendations/orchestrator";
import { getRecommendations, updateRecommendationStatus } from "@/lib/recommendations/queries";
import { generatePresenceContent } from "@/lib/presence/orchestrator";
import { recomputeAuditMetrics } from "@/lib/analysis/recurring-audit";
import { db } from "@/lib/db/client";
import { visibilityScores } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface FeedbackLoopResult {
  skippedDueToCooldown: boolean;
  recommendationsGenerated: number;
  autoApplied: number;
  presenceRegenerated: boolean;
  auditMetricsReScored: boolean;
  cooldownSetUntil: string | null;
}

/**
 * Run the feedback loop for a client:
 * 1. Check cooldown
 * 2. Compute latest visibility scores
 * 3. Generate recommendations
 * 4. Auto-apply critical accuracy fixes
 * 5. Regenerate presence for affected formats
 * 6. Set 48-hour cooldown
 */
export async function runFeedbackLoop(
  clientId: string
): Promise<FeedbackLoopResult> {
  // 1. Check cooldown
  if (await isCooldownActive(clientId)) {
    return {
      skippedDueToCooldown: true,
      recommendationsGenerated: 0,
      autoApplied: 0,
      presenceRegenerated: false,
      auditMetricsReScored: false,
      cooldownSetUntil: null,
    };
  }

  // 2. Compute latest visibility scores
  const today = new Date().toISOString().split("T")[0];
  await computeVisibilityScore(clientId, today);

  // 3. Generate recommendations
  const genResult = await generateRecommendationsForClient(clientId);

  // 4. Auto-apply critical accuracy fixes
  const pending = await getRecommendations(clientId, { status: "pending" });
  const criticalFixes = pending.filter(
    (r) => r.type === "accuracy_fix" && r.priority === "critical"
  );

  let autoApplied = 0;
  for (const fix of criticalFixes) {
    await updateRecommendationStatus(fix.id, "applied", {
      appliedAt: new Date().toISOString(),
      presenceFormatsRegenerated: ["json_ld", "llms_txt", "faq_page", "markdown_page", "product_feed"],
    });
    autoApplied++;
  }

  // 5. Regenerate presence if any fixes were auto-applied
  let presenceRegenerated = false;
  if (autoApplied > 0) {
    try {
      await generatePresenceContent(clientId);
      presenceRegenerated = true;
    } catch (err) {
      console.error("[FeedbackLoop] Presence regeneration failed:", err);
    }
  }

  // 6. Re-score audit metrics after presence regeneration
  let auditMetricsReScored = false;
  if (presenceRegenerated) {
    try {
      const metrics = await recomputeAuditMetrics(clientId);
      // Update today's visibility score metadata with fresh audit metrics
      const [existing] = await db
        .select()
        .from(visibilityScores)
        .where(
          and(
            eq(visibilityScores.clientId, clientId),
            eq(visibilityScores.date, today)
          )
        )
        .limit(1);
      if (existing) {
        await db
          .update(visibilityScores)
          .set({ metadata: metrics as unknown as Record<string, unknown> })
          .where(eq(visibilityScores.id, existing.id));
      }
      auditMetricsReScored = true;
    } catch (err) {
      console.error("[FeedbackLoop] Audit metrics re-scoring failed:", err);
    }
  }

  // 7. Set 48-hour cooldown
  const cooldownUntil = await setCooldown(clientId, 48);

  return {
    skippedDueToCooldown: false,
    recommendationsGenerated: genResult.generated,
    autoApplied,
    presenceRegenerated,
    auditMetricsReScored,
    cooldownSetUntil: cooldownUntil.toISOString(),
  };
}
