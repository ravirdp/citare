import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePresenceContent } from "@/lib/presence/orchestrator";
import type { PresenceFormat } from "@/lib/presence/types";

/**
 * POST /api/presence/:clientId/generate
 * Trigger presence content generation for all formats.
 * Optional body: { formats?: PresenceFormat[] }
 */
export async function POST(
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
    let formats: PresenceFormat[] | undefined;
    try {
      const body = await request.json();
      if (body.formats) formats = body.formats;
    } catch {
      // No body is fine — generate all formats
    }

    const results = await generatePresenceContent(clientId, formats);

    const summary = {
      generated: results.filter((r) => r.status === "generated").length,
      unchanged: results.filter((r) => r.status === "unchanged").length,
      errors: results.filter((r) => r.status === "error").length,
    };

    return NextResponse.json({
      success: true,
      summary,
      results: results.map((r) => ({
        format: r.format,
        language: r.language,
        status: r.status,
        error: r.error,
      })),
    });
  } catch (err) {
    console.error("Presence generation error:", err);
    return NextResponse.json(
      {
        error: "Generation failed",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
