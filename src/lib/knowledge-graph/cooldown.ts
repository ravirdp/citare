import { db } from "@/lib/db/client";
import { knowledgeGraphs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Set a cooldown period after strategist changes to prevent thrashing.
 */
export async function setCooldown(clientId: string, hours = 48) {
  const until = new Date();
  until.setHours(until.getHours() + hours);

  await db
    .update(knowledgeGraphs)
    .set({ strategistCooldownUntil: until })
    .where(eq(knowledgeGraphs.clientId, clientId));

  return until;
}

/**
 * Check if a cooldown is currently active for a client's KG.
 */
export async function isCooldownActive(clientId: string): Promise<boolean> {
  const [kg] = await db
    .select({ cooldown: knowledgeGraphs.strategistCooldownUntil })
    .from(knowledgeGraphs)
    .where(eq(knowledgeGraphs.clientId, clientId))
    .limit(1);

  if (!kg?.cooldown) return false;
  return new Date(kg.cooldown) > new Date();
}

/**
 * Clear the cooldown for a client's KG.
 */
export async function clearCooldown(clientId: string) {
  await db
    .update(knowledgeGraphs)
    .set({ strategistCooldownUntil: null })
    .where(eq(knowledgeGraphs.clientId, clientId));
}
