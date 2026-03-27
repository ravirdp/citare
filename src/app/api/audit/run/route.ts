import { NextRequest, NextResponse } from "next/server";
import { runAudit } from "@/lib/audit/generator";

/**
 * POST /api/audit/run
 * Accepts { url, businessName } and returns the full audit report.
 * Public endpoint — no auth required (this is the agency hook).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      url?: string;
      businessName?: string;
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
      contactCity?: string;
    };

    if (!body.url || !body.businessName) {
      return NextResponse.json(
        { error: "Both 'url' and 'businessName' are required" },
        { status: 400 }
      );
    }

    if (!body.contactName || !body.contactEmail) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Basic URL validation
    let normalizedUrl = body.url.trim();
    if (!normalizedUrl.startsWith("http")) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    try {
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const report = await runAudit(normalizedUrl, body.businessName.trim(), {
      contactName: body.contactName.trim(),
      contactEmail: body.contactEmail.trim(),
      contactPhone: body.contactPhone?.trim(),
      contactCity: body.contactCity?.trim(),
    });
    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Audit failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
