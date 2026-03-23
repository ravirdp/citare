import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/user";
import { db } from "@/lib/db/client";
import { agencies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/agency/settings
 * Get the authenticated user's agency settings.
 */
export async function GET() {
  let agencyId: string;

  try {
    const user = await requireRole(["agency_admin", "agency_member"]);
    if (!user.agencyId) {
      return NextResponse.json(
        { error: "User is not associated with an agency" },
        { status: 403 }
      );
    }
    agencyId = user.agencyId;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message },
      { status: message.includes("Unauthorized") ? 401 : 403 }
    );
  }

  try {
    const [agency] = await db
      .select()
      .from(agencies)
      .where(eq(agencies.id, agencyId))
      .limit(1);

    if (!agency) {
      return NextResponse.json(
        { error: "Agency not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ agency });
  } catch (err) {
    console.error("Get agency settings error:", err);
    return NextResponse.json(
      { error: "Failed to get agency settings" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/agency/settings
 * Update agency settings/branding.
 * Body: { name?, branding?, settings? }
 */
export async function PATCH(request: NextRequest) {
  let agencyId: string;

  try {
    const user = await requireRole(["agency_admin"]);
    if (!user.agencyId) {
      return NextResponse.json(
        { error: "User is not associated with an agency" },
        { status: 403 }
      );
    }
    agencyId = user.agencyId;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message },
      { status: message.includes("Unauthorized") ? 401 : 403 }
    );
  }

  try {
    const body = await request.json();
    const { name, branding, settings } = body;

    // Validate accent color if provided in branding
    if (branding?.accent_color) {
      const hexPattern = /^#[0-9A-Fa-f]{6}$/;
      if (!hexPattern.test(branding.accent_color)) {
        return NextResponse.json(
          { error: "branding.accent_color must be a valid hex color (e.g. #FF5733)" },
          { status: 400 }
        );
      }
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (branding !== undefined) updates.branding = branding;
    if (settings !== undefined) updates.settings = settings;

    const [agency] = await db
      .update(agencies)
      .set(updates)
      .where(eq(agencies.id, agencyId))
      .returning();

    if (!agency) {
      return NextResponse.json(
        { error: "Agency not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ agency });
  } catch (err) {
    console.error("Update agency settings error:", err);
    return NextResponse.json(
      { error: "Failed to update agency settings" },
      { status: 500 }
    );
  }
}
