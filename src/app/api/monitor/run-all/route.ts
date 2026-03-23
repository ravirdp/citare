import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runMonitoringForAll } from "@/lib/monitoring/runner";

/**
 * POST /api/monitor/run-all — Trigger monitoring for all active clients.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await runMonitoringForAll();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
