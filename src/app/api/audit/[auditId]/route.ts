import { NextRequest, NextResponse } from "next/server";
import { getAuditById } from "@/lib/audit/generator";

/**
 * GET /api/audit/:auditId
 * Retrieve a completed audit report. Public endpoint.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ auditId: string }> }
) {
  const { auditId } = await params;
  const report = await getAuditById(auditId);

  if (!report) {
    return NextResponse.json(
      { error: "Audit not found or not yet completed" },
      { status: 404 }
    );
  }

  return NextResponse.json(report);
}
