import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/user";
import { db } from "@/lib/db/client";
import { subscriptions, clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/admin/subscriptions
 * List all subscriptions with client names. Super admin only.
 */
export async function GET() {
  try {
    await requireRole(["super_admin"]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message },
      { status: message.includes("Unauthorized") ? 401 : 403 }
    );
  }

  const allSubs = await db.select().from(subscriptions);

  // Get client names
  const clientIds = [...new Set(allSubs.map((s) => s.clientId))];
  const clientRows =
    clientIds.length > 0
      ? await db.select().from(clients)
      : [];

  const clientMap = new Map(clientRows.map((c) => [c.id, c.name]));

  const result = allSubs.map((s) => ({
    id: s.id,
    clientName: clientMap.get(s.clientId) ?? "Unknown",
    plan: s.plan,
    status: s.status,
    trialEnd: s.trialEnd?.toISOString() ?? null,
    monthlyFeeInr: s.monthlyFeeInr,
    monitoringFrequency: s.monitoringFrequency,
    razorpaySubscriptionId: s.razorpaySubscriptionId,
  }));

  return NextResponse.json({ subscriptions: result });
}
