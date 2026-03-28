import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/user";
import { db } from "@/lib/db/client";
import { subscriptions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { PLANS, type PlanId } from "@/lib/billing/plans";

/**
 * GET /api/billing/subscription/:clientId
 * Returns the current subscription with plan details and days remaining.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = await params;

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.clientId, clientId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (!sub) {
    return NextResponse.json({ error: "No subscription found" }, { status: 404 });
  }

  const plan = PLANS[sub.plan as PlanId] ?? PLANS.trial;
  const now = Date.now();

  let daysRemaining: number | null = null;
  if (sub.status === "trialing" && sub.trialEnd) {
    daysRemaining = Math.max(0, Math.ceil((sub.trialEnd.getTime() - now) / 86400000));
  } else if (sub.status === "active" && sub.currentPeriodEnd) {
    daysRemaining = Math.max(0, Math.ceil((sub.currentPeriodEnd.getTime() - now) / 86400000));
  }

  return NextResponse.json({
    id: sub.id,
    plan: sub.plan,
    planName: plan.name,
    price: plan.price,
    status: sub.status,
    monitoringFrequency: sub.monitoringFrequency,
    trialEnd: sub.trialEnd?.toISOString() ?? null,
    currentPeriodStart: sub.currentPeriodStart?.toISOString() ?? null,
    currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
    cancelledAt: sub.cancelledAt?.toISOString() ?? null,
    daysRemaining,
    features: plan.features,
    maxServices: plan.max_services,
    maxProducts: plan.max_products,
  });
}
