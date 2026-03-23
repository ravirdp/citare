import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/user";
import { db } from "@/lib/db/client";
import { apiUsageLogs, clients } from "@/lib/db/schema";
import { sql, eq, and } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
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
    const { clientId } = await params;

    // Get client info
    const [client] = await db
      .select({ id: clients.id, name: clients.name, slug: clients.slug })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // By provider
    const byProvider = await db
      .select({
        provider: apiUsageLogs.provider,
        total: sql<string>`COALESCE(SUM(${apiUsageLogs.costInr}), 0)`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(apiUsageLogs)
      .where(eq(apiUsageLogs.clientId, clientId))
      .groupBy(apiUsageLogs.provider);

    // By tier
    const byTier = await db
      .select({
        tier: apiUsageLogs.tier,
        total: sql<string>`COALESCE(SUM(${apiUsageLogs.costInr}), 0)`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(apiUsageLogs)
      .where(eq(apiUsageLogs.clientId, clientId))
      .groupBy(apiUsageLogs.tier);

    // Total
    const [totalResult] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${apiUsageLogs.costInr}), 0)`,
      })
      .from(apiUsageLogs)
      .where(eq(apiUsageLogs.clientId, clientId));

    return NextResponse.json({
      client,
      costs: {
        byProvider,
        byTier,
        total: parseFloat(totalResult.total),
      },
    });
  } catch (err) {
    console.error("Client costs error:", err);
    return NextResponse.json(
      { error: "Failed to fetch client costs" },
      { status: 500 }
    );
  }
}
