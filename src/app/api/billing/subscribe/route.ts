import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/user";
import { db } from "@/lib/db/client";
import { subscriptions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PLANS, type PlanId } from "@/lib/billing/plans";
import {
  createCustomer,
  createSubscription,
} from "@/lib/billing/razorpay";

/**
 * POST /api/billing/subscribe
 * Creates a Razorpay subscription with 7-day trial for the authenticated user's client.
 */
export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { planId } = (await request.json()) as { planId: string };

  if (!planId || !(planId in PLANS) || planId === "trial") {
    return NextResponse.json(
      { error: "Invalid plan. Choose: starter, growth, ecommerce, or enterprise." },
      { status: 400 }
    );
  }

  const plan = PLANS[planId as PlanId];

  if (!user.clientId) {
    return NextResponse.json({ error: "No client record found" }, { status: 400 });
  }

  // Check if Razorpay is configured
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    // Dev/simulation mode — just create the subscription row without Razorpay
    const trialEnd = new Date(Date.now() + 7 * 86400 * 1000);

    await db.insert(subscriptions).values({
      clientId: user.clientId,
      plan: planId,
      status: "trialing",
      monitoringFrequency: plan.monitoring_frequency,
      monthlyFeeInr: plan.price,
      trialEnd,
    });

    return NextResponse.json({
      success: true,
      message: "Trial subscription created (Razorpay not configured — dev mode)",
      redirect: "/onboarding",
    });
  }

  try {
    // Get or create Razorpay customer
    const [existing] = await db
      .select({ razorpayCustomerId: subscriptions.razorpayCustomerId })
      .from(subscriptions)
      .where(eq(subscriptions.clientId, user.clientId))
      .limit(1);

    let customerId = existing?.razorpayCustomerId;

    if (!customerId) {
      customerId = await createCustomer(
        user.name ?? user.email,
        user.email
      );
    }

    const razorpayPlanId = plan.razorpay_plan_id;
    if (!razorpayPlanId) {
      return NextResponse.json(
        { error: `Razorpay plan ID not configured for ${planId}` },
        { status: 500 }
      );
    }

    const subscription = await createSubscription(
      customerId,
      razorpayPlanId,
      12,
      7
    );

    const trialEnd = new Date(Date.now() + 7 * 86400 * 1000);

    await db.insert(subscriptions).values({
      clientId: user.clientId,
      plan: planId,
      status: "trialing",
      monitoringFrequency: plan.monitoring_frequency,
      monthlyFeeInr: plan.price,
      trialEnd,
      razorpaySubscriptionId: subscription.id,
      razorpayCustomerId: customerId,
      razorpayPlanId: razorpayPlanId,
    });

    return NextResponse.json({
      success: true,
      subscription_id: subscription.id,
      short_url: subscription.short_url,
      status: subscription.status,
    });
  } catch (err) {
    console.error("Billing subscribe error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create subscription" },
      { status: 500 }
    );
  }
}
