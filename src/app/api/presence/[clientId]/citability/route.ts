import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { presenceDeployments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { analyzeContentCitability } from "@/lib/analysis/citability";

/**
 * GET /api/presence/:clientId/citability
 * Returns citability scores for all deployed presence formats.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;

  const deployments = await db
    .select()
    .from(presenceDeployments)
    .where(eq(presenceDeployments.clientId, clientId));

  if (deployments.length === 0) {
    return NextResponse.json({ error: "No presence deployments found" }, { status: 404 });
  }

  const results = deployments
    .filter((d) => d.content && d.content.length > 0)
    .map((d) => {
      const citability = analyzeContentCitability(d.content!);
      return {
        format: d.format,
        language: d.language,
        status: d.status,
        citability,
      };
    });

  const avgScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.citability.averageScore, 0) / results.length * 10) / 10
    : 0;

  return NextResponse.json({
    clientId,
    overallCitabilityScore: avgScore,
    formats: results,
  });
}
