import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/user";
import { db } from "@/lib/db/client";
import { apiUsageLogs, clients } from "@/lib/db/schema";
import { sql, eq, gte, and } from "drizzle-orm";

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
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total today
    const [todayResult] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${apiUsageLogs.costInr}), 0)`,
      })
      .from(apiUsageLogs)
      .where(gte(apiUsageLogs.createdAt, startOfDay));

    // Total this week
    const [weekResult] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${apiUsageLogs.costInr}), 0)`,
      })
      .from(apiUsageLogs)
      .where(gte(apiUsageLogs.createdAt, startOfWeek));

    // Total this month
    const [monthResult] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${apiUsageLogs.costInr}), 0)`,
      })
      .from(apiUsageLogs)
      .where(gte(apiUsageLogs.createdAt, startOfMonth));

    // By client
    const byClient = await db
      .select({
        clientId: apiUsageLogs.clientId,
        clientName: clients.name,
        provider: apiUsageLogs.provider,
        total: sql<string>`COALESCE(SUM(${apiUsageLogs.costInr}), 0)`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(apiUsageLogs)
      .leftJoin(clients, eq(apiUsageLogs.clientId, clients.id))
      .where(gte(apiUsageLogs.createdAt, startOfMonth))
      .groupBy(apiUsageLogs.clientId, clients.name, apiUsageLogs.provider);

    return NextResponse.json({
      totalToday: parseFloat(todayResult.total),
      totalWeek: parseFloat(weekResult.total),
      totalMonth: parseFloat(monthResult.total),
      byClient,
    });
  } catch (err) {
    console.error("Costs query error:", err);
    return NextResponse.json(
      { error: "Failed to fetch costs" },
      { status: 500 }
    );
  }
}
