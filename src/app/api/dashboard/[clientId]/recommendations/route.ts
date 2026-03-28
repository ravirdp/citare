import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRecommendations } from "@/lib/recommendations/queries";
import type { RecommendationStatus, RecommendationType } from "@/lib/recommendations/types";

/**
 * GET /api/dashboard/:clientId/recommendations
 * List recommendations, optionally filtered by status/type.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as RecommendationStatus | null;
  const type = searchParams.get("type") as RecommendationType | null;

  const recs = await getRecommendations(
    clientId,
    {
      status: status ?? undefined,
      type: type ?? undefined,
    }
  );

  return NextResponse.json({ recommendations: recs });
}
