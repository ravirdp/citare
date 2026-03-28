import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeAttributionForClient } from "@/lib/attribution/engine";
import { checkFeatureAccess } from "@/lib/billing/guards";

/**
 * GET /api/dashboard/:clientId/attribution
 * Return the AI Search Impact Score.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;

  const access = await checkFeatureAccess(clientId, "attribution");
  if (!access.allowed) {
    return NextResponse.json(
      { error: `Attribution requires the Growth plan or higher. Current plan: ${access.currentPlan}.`, upgrade_url: "/billing" },
      { status: 403 }
    );
  }

  try {
    const impact = await computeAttributionForClient(clientId);
    return NextResponse.json(impact);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
