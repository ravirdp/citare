import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateMonthlyReport } from "@/lib/reports/generator";

/**
 * GET /api/reports/:clientId/:month
 * Retrieve or generate a report for the given month.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string; month: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId, month } = await params;

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { error: "Invalid month format. Use YYYY-MM." },
      { status: 400 }
    );
  }

  try {
    const report = await generateMonthlyReport(clientId, month);
    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
