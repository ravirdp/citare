import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getKnowledgeGraph } from "@/lib/knowledge-graph/queries";
import { updateKnowledgeGraph } from "@/lib/knowledge-graph/builder";
import type { KnowledgeGraphData } from "@/lib/knowledge-graph/types";

/**
 * GET /api/kg/:clientId
 * Returns the current knowledge graph for a client.
 */
export async function GET(
  _request: NextRequest,
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

  return NextResponse.json(kg);
}

/**
 * PATCH /api/kg/:clientId
 * Apply manual updates to the knowledge graph.
 * Body: { updates: Partial<KnowledgeGraphData>, reason?: string }
 */
export async function PATCH(
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

  try {
    const body = await request.json();
    const updates = body.updates as Partial<KnowledgeGraphData>;
    const reason = (body.reason as string) || "Manual edit";

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "updates object is required" },
        { status: 400 }
      );
    }

    const kg = await getKnowledgeGraph(clientId);
    if (!kg) {
      return NextResponse.json(
        { error: "Knowledge graph not found for this client" },
        { status: 404 }
      );
    }

    const updated = await updateKnowledgeGraph(
      kg.id,
      updates,
      "manual",
      reason
    );

    return NextResponse.json({
      success: true,
      version: updated.version,
    });
  } catch (err) {
    console.error("KG PATCH error:", err);
    return NextResponse.json(
      {
        error: "Update failed",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
