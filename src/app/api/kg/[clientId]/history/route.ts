import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getKnowledgeGraph } from "@/lib/knowledge-graph/queries";
import { getKnowledgeGraphHistory } from "@/lib/knowledge-graph/queries";

/**
 * GET /api/kg/:clientId/history
 * Returns version history for the client's knowledge graph.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = await params;
  const kg = await getKnowledgeGraph(clientId);

  if (!kg) {
    return NextResponse.json(
      { error: "Knowledge graph not found for this client" },
      { status: 404 }
    );
  }

  const limit = parseInt(
    request.nextUrl.searchParams.get("limit") ?? "20",
    10
  );

  const history = await getKnowledgeGraphHistory(kg.id, limit);

  return NextResponse.json({ history });
}
