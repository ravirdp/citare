import Razorpay from "razorpay";
import crypto from "crypto";

let _instance: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (_instance) return _instance;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)");
  }

  _instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return _instance;
}

/**
 * Create a Razorpay customer for billing.
 */
export async function createCustomer(
  name: string,
  email: string,
  phone?: string
): Promise<string> {
  const rz = getRazorpay();
  const customer = await rz.customers.create({
    name,
    email,
    contact: phone,
  });
  return customer.id;
}

/**
 * Create a Razorpay subscription with optional trial.
 * Uses type assertion because the SDK types omit customer_id from create body
 * even though the Razorpay API accepts it.
 */
export async function createSubscription(
  customerId: string,
  planId: string,
  totalCount = 12,
  trialDays = 7
): Promise<{ id: string; short_url: string; status: string }> {
  const rz = getRazorpay();

  const startAt = Math.floor(Date.now() / 1000) + trialDays * 86400;

  const subscription = await (rz.subscriptions.create as unknown as (params: Record<string, unknown>) => Promise<Record<string, unknown>>)({
    plan_id: planId,
    customer_id: customerId,
    total_count: totalCount,
    start_at: startAt,
    customer_notify: 1,
  });

  return {
    id: subscription.id as string,
    short_url: (subscription.short_url ?? "") as string,
    status: (subscription.status ?? "created") as string,
  };
}

/**
 * Cancel a Razorpay subscription.
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtCycleEnd = true
): Promise<void> {
  const rz = getRazorpay();
  await rz.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
}

/**
 * Fetch a Razorpay subscription's current status.
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Record<string, unknown>> {
  const rz = getRazorpay();
  const sub = await rz.subscriptions.fetch(subscriptionId);
  return sub as unknown as Record<string, unknown>;
}

/**
 * Verify Razorpay webhook signature.
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET not configured");
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}
