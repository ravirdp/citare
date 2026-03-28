import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/user";
import { generateRecommendationsForClient } from "@/lib/recommendations/orchestrator";
import { checkFeatureAccess } from "@/lib/billing/guards";

/**
 * POST /api/dashboard/:clientId/recommendations/generate
 * Trigger recommendation generation for a client.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = await params;

  const access = await checkFeatureAccess(clientId, "recommendations");
  if (!access.allowed) {
    return NextResponse.json(
      { error: `This feature requires the ${access.requiredPlan ? access.requiredPlan.charAt(0).toUpperCase() + access.requiredPlan.slice(1) : "Starter"} plan or higher. Current plan: ${access.currentPlan}.`, upgrade_url: "/billing" },
      { status: 403 }
    );
  }

  try {
    const result = await generateRecommendationsForClient(clientId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
