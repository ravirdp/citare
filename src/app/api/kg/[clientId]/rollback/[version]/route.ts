import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getKnowledgeGraph } from "@/lib/knowledge-graph/queries";
import { rollbackKnowledgeGraph } from "@/lib/knowledge-graph/builder";

/**
 * POST /api/kg/:clientId/rollback/:version
 * Rollback the knowledge graph to a previous version.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string; version: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId, version } = await params;
  const targetVersion = parseInt(version, 10);

  if (isNaN(targetVersion) || targetVersion < 1) {
    return NextResponse.json(
      { error: "Invalid version number" },
      { status: 400 }
    );
  }

  try {
    const kg = await getKnowledgeGraph(clientId);
    if (!kg) {
      return NextResponse.json(
        { error: "Knowledge graph not found for this client" },
        { status: 404 }
      );
    }

    const updated = await rollbackKnowledgeGraph(kg.id, targetVersion);

    return NextResponse.json({
      success: true,
      version: updated.version,
      message: `Rolled back to version ${targetVersion}`,
    });
  } catch (err) {
    console.error("KG rollback error:", err);
    return NextResponse.json(
      {
        error: "Rollback failed",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
