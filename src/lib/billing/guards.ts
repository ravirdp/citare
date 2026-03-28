import { db } from "@/lib/db/client";
import { subscriptions, knowledgeGraphs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { PLANS, type PlanId, type Feature } from "./plans";

export interface SubscriptionInfo {
  id: string;
  plan: PlanId;
  status: string;
  monitoringFrequency: string;
  trialEnd: Date | null;
  currentPeriodEnd: Date | null;
  features: readonly string[];
}

/**
 * Get the most recent subscription for a client.
 */
export async function getSubscriptionForClient(
  clientId: string
): Promise<SubscriptionInfo | null> {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.clientId, clientId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (!sub) return null;

  const planId = (sub.plan in PLANS ? sub.plan : "trial") as PlanId;
  const plan = PLANS[planId];

  return {
    id: sub.id,
    plan: planId,
    status: sub.status,
    monitoringFrequency: sub.monitoringFrequency,
    trialEnd: sub.trialEnd,
    currentPeriodEnd: sub.currentPeriodEnd,
    features: plan.features,
  };
}

/**
 * Check if a specific feature is available on the client's plan.
 */
export async function checkFeatureAccess(
  clientId: string,
  feature: Feature
): Promise<{ allowed: boolean; currentPlan: string; requiredPlan?: string }> {
  const sub = await getSubscriptionForClient(clientId);

  if (!sub) {
    return { allowed: false, currentPlan: "none", requiredPlan: "starter" };
  }

  if (!isActiveStatus(sub.status, sub.trialEnd)) {
    return { allowed: false, currentPlan: sub.plan, requiredPlan: sub.plan };
  }

  if ((sub.features as readonly string[]).includes(feature)) {
    return { allowed: true, currentPlan: sub.plan };
  }

  // Find the cheapest plan that includes this feature
  const requiredPlan = (Object.entries(PLANS) as [PlanId, (typeof PLANS)[PlanId]][]).find(
    ([, p]) => (p.features as readonly string[]).includes(feature)
  );

  return {
    allowed: false,
    currentPlan: sub.plan,
    requiredPlan: requiredPlan?.[0] ?? "enterprise",
  };
}

/**
 * Check service limits for a client.
 */
export async function checkServiceLimit(
  clientId: string
): Promise<{ allowed: number; used: number; exceeded: boolean }> {
  const sub = await getSubscriptionForClient(clientId);
  const plan = sub ? PLANS[sub.plan] : PLANS.trial;

  const [kg] = await db
    .select()
    .from(knowledgeGraphs)
    .where(eq(knowledgeGraphs.clientId, clientId))
    .limit(1);

  const services = (kg?.services ?? []) as unknown[];
  const used = services.length;
  const allowed = plan.max_services;

  return {
    allowed,
    used,
    exceeded: allowed !== -1 && used >= allowed,
  };
}

/**
 * Check if a client has an active (trialing or active) subscription.
 */
export async function isSubscriptionActive(
  clientId: string
): Promise<boolean> {
  const sub = await getSubscriptionForClient(clientId);
  if (!sub) return false;
  return isActiveStatus(sub.status, sub.trialEnd);
}

/**
 * Get remaining trial days for a client.
 */
export async function getTrialDaysRemaining(
  clientId: string
): Promise<number | null> {
  const sub = await getSubscriptionForClient(clientId);
  if (!sub || sub.status !== "trialing" || !sub.trialEnd) return null;

  const remaining = Math.ceil((sub.trialEnd.getTime() - Date.now()) / 86400000);
  return Math.max(0, remaining);
}

function isActiveStatus(status: string, trialEnd: Date | null): boolean {
  if (status === "active") return true;
  if (status === "trialing") {
    if (!trialEnd) return true;
    return trialEnd.getTime() > Date.now();
  }
  return false;
}
