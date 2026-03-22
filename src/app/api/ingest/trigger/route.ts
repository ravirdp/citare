import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ingestClient } from "@/lib/integrations/orchestrator";

/**
 * POST /api/ingest/trigger
 * Body: { clientId: string }
 * Triggers data ingestion for all connected sources of a client.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    const results = await ingestClient(clientId);

    return NextResponse.json({
      success: true,
      message: "Ingestion complete",
      results,
    });
  } catch (err) {
    console.error("Ingestion trigger error:", err);
    return NextResponse.json(
      {
        error: "Ingestion failed",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
