import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/user";
import { db } from "@/lib/db/client";
import { agencies, clients } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/admin/agencies/[agencyId]
 * Get single agency with its clients.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ agencyId: string }> }
) {
  try {
    const user = await requireRole(["super_admin"]);
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message },
      { status: message.includes("Unauthorized") ? 401 : 403 }
    );
  }

  try {
    const { agencyId } = await params;

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

    const agencyClients = await db
      .select()
      .from(clients)
      .where(eq(clients.agencyId, agencyId))
      .orderBy(desc(clients.createdAt));

    return NextResponse.json({ agency, clients: agencyClients });
  } catch (err) {
    console.error("Get agency error:", err);
    return NextResponse.json(
      { error: "Failed to get agency" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/agencies/[agencyId]
 * Update agency details.
 * Body: { name?, branding?, settings?, subscriptionTier? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ agencyId: string }> }
) {
  try {
    const user = await requireRole(["super_admin"]);
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message },
      { status: message.includes("Unauthorized") ? 401 : 403 }
    );
  }

  try {
    const { agencyId } = await params;
    const body = await request.json();
    const { name, branding, settings, subscriptionTier } = body;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (branding !== undefined) updates.branding = branding;
    if (settings !== undefined) updates.settings = settings;
    if (subscriptionTier !== undefined) updates.subscriptionTier = subscriptionTier;

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
    console.error("Update agency error:", err);
    return NextResponse.json(
      { error: "Failed to update agency" },
      { status: 500 }
    );
  }
}
