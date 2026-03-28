import { db } from "@/lib/db/client";
import { dataSources } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface ActionDataPoint {
  date: string;
  calls: number;
  directions: number;
  websiteClicks: number;
}

/**
 * Extract GBP action data (calls, directions, website clicks) from raw data.
 * Reads from data_sources where sourceType = 'google_gbp'.
 */
export async function collectActionData(
  clientId: string
): Promise<ActionDataPoint[]> {
  const sources = await db
    .select()
    .from(dataSources)
    .where(
      and(
        eq(dataSources.clientId, clientId),
        eq(dataSources.sourceType, "google_gbp")
      )
    );

  if (sources.length === 0) return [];

  const rawData = sources[0].rawData as Record<string, unknown> | null;
  if (!rawData) return [];

  // Extract GBP insights from raw data (Phase 1 ingestion format)
  const insights = rawData.insights as Record<string, unknown> | undefined;
  if (!insights) return [];

  return [
    {
      date: new Date().toISOString().split("T")[0],
      calls: Number(insights.phoneCalls ?? 0),
      directions: Number(insights.directionRequests ?? 0),
      websiteClicks: Number(insights.websiteClicks ?? 0),
    },
  ];
}
