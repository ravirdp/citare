import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/user";
import { computeAttributionForClient } from "@/lib/attribution/engine";

/**
 * POST /api/dashboard/:clientId/attribution/compute
 * Trigger attribution computation.
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

  try {
    const impact = await computeAttributionForClient(clientId);
    return NextResponse.json(impact);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
