import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/user";
import { updateRecommendationStatus } from "@/lib/recommendations/queries";

/**
 * POST /api/dashboard/:clientId/recommendations/:recommendationId/reject
 * Reject a recommendation.
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

  const { recommendationId } = await params;

  try {
    const rec = await updateRecommendationStatus(recommendationId, "rejected");
    if (!rec) {
      return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
    }
    return NextResponse.json({ recommendation: rec });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
