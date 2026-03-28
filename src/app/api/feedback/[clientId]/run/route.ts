import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/user";
import { runFeedbackLoop } from "@/lib/feedback/loop";
import { isSubscriptionActive } from "@/lib/billing/guards";

/**
 * POST /api/feedback/:clientId/run
 * Trigger the feedback loop for a client.
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

  if (!(await isSubscriptionActive(clientId))) {
    return NextResponse.json(
      { error: "Subscription expired. Please upgrade.", upgrade_url: "/billing" },
      { status: 403 }
    );
  }

  try {
    const result = await runFeedbackLoop(clientId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
