import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/user";
import { db } from "@/lib/db/client";
import { clients, dataSources, knowledgeGraphs } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";

/**
 * GET /api/agency/clients
 * List clients for the authenticated user's agency.
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
    const agencyClients = await db
      .select({
        id: clients.id,
        name: clients.name,
        slug: clients.slug,
        businessType: clients.businessType,
        status: clients.status,
        languages: clients.languages,
        monthlyFeeInr: clients.monthlyFeeInr,
        createdAt: clients.createdAt,
        updatedAt: clients.updatedAt,
        dataSourceCount: sql<number>`(
          SELECT COUNT(*)::int FROM data_sources WHERE data_sources.client_id = ${clients.id}
        )`,
        kgVersion: sql<number | null>`(
          SELECT version FROM knowledge_graphs WHERE knowledge_graphs.client_id = ${clients.id} LIMIT 1
        )`,
      })
      .from(clients)
      .where(eq(clients.agencyId, agencyId))
      .orderBy(desc(clients.createdAt));

    return NextResponse.json({ clients: agencyClients });
  } catch (err) {
    console.error("List agency clients error:", err);
    return NextResponse.json(
      { error: "Failed to list clients" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agency/clients
 * Create a client within the agency.
 * Body: { name, slug, businessType, languages?, landmarkDescription?, monthlyFeeInr? }
 */
export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { name, slug, businessType, languages, landmarkDescription, monthlyFeeInr } = body;

    if (!name || !slug || !businessType) {
      return NextResponse.json(
        { error: "name, slug, and businessType are required" },
        { status: 400 }
      );
    }

    if (!["physical", "ecommerce", "hybrid"].includes(businessType)) {
      return NextResponse.json(
        { error: "businessType must be physical, ecommerce, or hybrid" },
        { status: 400 }
      );
    }

    const [client] = await db
      .insert(clients)
      .values({
        agencyId,
        name,
        slug,
        businessType,
        languages: languages ?? ["en"],
        landmarkDescription: landmarkDescription ?? null,
        monthlyFeeInr: monthlyFeeInr ?? null,
      })
      .returning();

    return NextResponse.json({ client }, { status: 201 });
  } catch (err) {
    console.error("Create agency client error:", err);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}
