import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { synthesizeKnowledgeGraph } from "@/lib/knowledge-graph/synthesize";

/**
 * POST /api/kg/:clientId/synthesize
 * Trigger knowledge graph synthesis from raw data sources.
 * In simulation mode, returns 202 with prompt file path.
 */
export async function POST(
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

  const result = await synthesizeKnowledgeGraph(clientId);

  if (result.status === "awaiting_simulation") {
    return NextResponse.json(
      {
        status: "awaiting_simulation",
        message:
          "Prompt written to file. Process it via Claude Max and place the response file.",
        promptPath: result.promptPath,
      },
      { status: 202 }
    );
  }

  if (result.status === "error") {
    return NextResponse.json(
      { error: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json({
    status: result.status,
    knowledgeGraphId: result.knowledgeGraphId,
    version: result.version,
  });
}
