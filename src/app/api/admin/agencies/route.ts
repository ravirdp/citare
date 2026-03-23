import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/user";
import { db } from "@/lib/db/client";
import { supabaseAdmin } from "@/lib/db/client";
import { agencies, clients, users } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import crypto from "crypto";

/**
 * GET /api/admin/agencies
 * List all agencies with client counts. Super admin only.
 */
export async function GET() {
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
    const allAgencies = await db
      .select({
        id: agencies.id,
        name: agencies.name,
        slug: agencies.slug,
        branding: agencies.branding,
        subscriptionTier: agencies.subscriptionTier,
        settings: agencies.settings,
        createdAt: agencies.createdAt,
        updatedAt: agencies.updatedAt,
        clientCount: sql<number>`(
          SELECT COUNT(*)::int FROM clients WHERE clients.agency_id = ${agencies.id}
        )`,
      })
      .from(agencies)
      .orderBy(desc(agencies.createdAt));

    return NextResponse.json({ agencies: allAgencies });
  } catch (err) {
    console.error("List agencies error:", err);
    return NextResponse.json(
      { error: "Failed to list agencies" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/agencies
 * Create a new agency. Optionally create an admin user.
 * Body: { name, slug, adminEmail?, adminName? }
 */
export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { name, slug, adminEmail, adminName } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "name and slug are required" },
        { status: 400 }
      );
    }

    const [agency] = await db
      .insert(agencies)
      .values({ name, slug })
      .returning();

    let adminUser = null;

    if (adminEmail) {
      const tempPassword = crypto.randomUUID().slice(0, 12);
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: adminEmail,
          password: tempPassword,
          email_confirm: true,
        });

      if (authError) {
        return NextResponse.json(
          { error: `Agency created but admin user failed: ${authError.message}` },
          { status: 500 }
        );
      }

      const [userRow] = await db
        .insert(users)
        .values({
          email: adminEmail,
          name: adminName ?? null,
          role: "agency_admin",
          agencyId: agency.id,
          authProviderId: authData.user.id,
        })
        .returning();

      adminUser = {
        id: userRow.id,
        email: userRow.email,
        name: userRow.name,
        role: userRow.role,
        tempPassword,
      };
    }

    return NextResponse.json({ agency, adminUser }, { status: 201 });
  } catch (err) {
    console.error("Create agency error:", err);
    return NextResponse.json(
      { error: "Failed to create agency" },
      { status: 500 }
    );
  }
}
