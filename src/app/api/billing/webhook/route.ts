import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyWebhookSignature } from "@/lib/billing/razorpay";

/**
 * POST /api/billing/webhook
 * Razorpay webhook handler. No auth — verified via HMAC signature.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    const valid = verifyWebhookSignature(body, signature);
    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } catch (err) {
    console.error("Webhook signature verification error:", err);
    return NextResponse.json({ error: "Signature verification failed" }, { status: 500 });
  }

  const event = JSON.parse(body) as {
    event: string;
    payload: {
      subscription?: { entity: Record<string, unknown> };
      payment?: { entity: Record<string, unknown> };
    };
  };

  const eventType = event.event;
  const subEntity = event.payload.subscription?.entity;
  const subId = subEntity?.id as string | undefined;

  if (!subId || !subEntity) {
    // Not a subscription event we care about
    return NextResponse.json({ received: true });
  }

  try {
    switch (eventType) {
      case "subscription.activated": {
        await db
          .update(subscriptions)
          .set({
            status: "active",
            currentPeriodStart: subEntity.current_start
              ? new Date((subEntity.current_start as number) * 1000)
              : undefined,
            currentPeriodEnd: subEntity.current_end
              ? new Date((subEntity.current_end as number) * 1000)
              : undefined,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.razorpaySubscriptionId, subId));
        break;
      }

      case "subscription.charged": {
        await db
          .update(subscriptions)
          .set({
            status: "active",
            currentPeriodStart: subEntity.current_start
              ? new Date((subEntity.current_start as number) * 1000)
              : undefined,
            currentPeriodEnd: subEntity.current_end
              ? new Date((subEntity.current_end as number) * 1000)
              : undefined,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.razorpaySubscriptionId, subId));
        break;
      }

      case "subscription.cancelled": {
        await db
          .update(subscriptions)
          .set({
            status: "cancelled",
            cancelledAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.razorpaySubscriptionId, subId));
        break;
      }

      case "subscription.paused": {
        await db
          .update(subscriptions)
          .set({ status: "paused", updatedAt: new Date() })
          .where(eq(subscriptions.razorpaySubscriptionId, subId));
        break;
      }

      case "subscription.expired": {
        await db
          .update(subscriptions)
          .set({ status: "expired", updatedAt: new Date() })
          .where(eq(subscriptions.razorpaySubscriptionId, subId));
        break;
      }

      case "payment.failed": {
        // Log failed payment in subscription metadata
        const paymentEntity = event.payload.payment?.entity;
        await db
          .update(subscriptions)
          .set({
            metadata: { last_payment_failed: paymentEntity ?? {} },
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.razorpaySubscriptionId, subId));
        break;
      }

      default:
        // Unknown event — log and acknowledge
        console.log(`Unhandled Razorpay event: ${eventType}`);
    }
  } catch (err) {
    console.error(`Webhook processing error for ${eventType}:`, err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
