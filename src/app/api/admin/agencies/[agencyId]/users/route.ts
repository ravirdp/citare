import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/user";
import { db } from "@/lib/db/client";
import { supabaseAdmin } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

/**
 * GET /api/admin/agencies/[agencyId]/users
 * List users for an agency.
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

    const agencyUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        agencyId: users.agencyId,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .where(eq(users.agencyId, agencyId));

    return NextResponse.json({ users: agencyUsers });
  } catch (err) {
    console.error("List agency users error:", err);
    return NextResponse.json(
      { error: "Failed to list users" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/agencies/[agencyId]/users
 * Create a user for an agency.
 * Body: { email, name, role: 'agency_admin' | 'agency_member' }
 */
export async function POST(
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
    const { email, name, role } = body;

    if (!email || !role) {
      return NextResponse.json(
        { error: "email and role are required" },
        { status: 400 }
      );
    }

    if (!["agency_admin", "agency_member"].includes(role)) {
      return NextResponse.json(
        { error: "role must be agency_admin or agency_member" },
        { status: 400 }
      );
    }

    const tempPassword = crypto.randomUUID().slice(0, 12);
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
      });

    if (authError) {
      return NextResponse.json(
        { error: `Failed to create auth user: ${authError.message}` },
        { status: 500 }
      );
    }

    const [userRow] = await db
      .insert(users)
      .values({
        email,
        name: name ?? null,
        role,
        agencyId,
        authProviderId: authData.user.id,
      })
      .returning();

    return NextResponse.json(
      {
        user: {
          id: userRow.id,
          email: userRow.email,
          name: userRow.name,
          role: userRow.role,
          agencyId: userRow.agencyId,
          tempPassword,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Create agency user error:", err);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
