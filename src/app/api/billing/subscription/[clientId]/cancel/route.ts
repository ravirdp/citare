import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/user";
import { db } from "@/lib/db/client";
import { subscriptions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { cancelSubscription } from "@/lib/billing/razorpay";

/**
 * POST /api/billing/subscription/:clientId/cancel
 * Cancels the active subscription.
 */
export async function POST(
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

  if (sub.status === "cancelled" || sub.status === "expired") {
    return NextResponse.json({ error: "Subscription already cancelled/expired" }, { status: 400 });
  }

  // Cancel on Razorpay if there's a subscription ID
  if (sub.razorpaySubscriptionId) {
    try {
      await cancelSubscription(sub.razorpaySubscriptionId);
    } catch (err) {
      console.error("Razorpay cancel error:", err);
      // Continue with DB update even if Razorpay fails
    }
  }

  await db
    .update(subscriptions)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, sub.id));

  return NextResponse.json({ success: true, status: "cancelled" });
}
