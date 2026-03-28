import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/user";
import { updateRecommendationStatus } from "@/lib/recommendations/queries";
import { generatePresenceContent } from "@/lib/presence/orchestrator";

/**
 * POST /api/dashboard/:clientId/recommendations/:recommendationId/approve
 * Approve a recommendation and execute its action.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string; recommendationId: string }> }
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId, recommendationId } = await params;

  try {
    // Mark as approved
    const rec = await updateRecommendationStatus(recommendationId, "approved");
    if (!rec) {
      return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
    }

    // Execute action based on type
    let presenceRegenerated = false;
    if (
      rec.type === "accuracy_fix" ||
      rec.type === "content_update" ||
      rec.type === "gap_alert"
    ) {
      // Regenerate presence content — direct function call, no Redis events
      try {
        await generatePresenceContent(clientId);
        presenceRegenerated = true;
      } catch (err) {
        console.error("[Recommendation] Presence regeneration failed:", err);
      }
    }

    // Mark as applied
    const applied = await updateRecommendationStatus(recommendationId, "applied", {
      appliedAt: new Date().toISOString(),
      presenceFormatsRegenerated: presenceRegenerated
        ? ["json_ld", "llms_txt", "faq_page", "markdown_page", "product_feed"]
        : [],
    });

    return NextResponse.json({ recommendation: applied, presenceRegenerated });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
