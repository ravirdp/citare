import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/user";
import { generateMonthlyReport } from "@/lib/reports/generator";

/**
 * POST /api/reports/:clientId/generate
 * Generate a monthly report. Body: { month: "2026-03" }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = await params;
  const body = await request.json();
  const month = body.month as string;

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
