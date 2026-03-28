import { db } from "@/lib/db/client";
import { dataSources } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface TrafficDataPoint {
  date: string;
  brandedSearchVolume: number;
  directTraffic: number;
}

/**
 * Extract branded search and direct traffic trends from Google Analytics raw data.
 * Reads from data_sources where sourceType = 'google_analytics'.
 */
export async function collectTrafficData(
  clientId: string
): Promise<TrafficDataPoint[]> {
  const sources = await db
    .select()
    .from(dataSources)
    .where(
      and(
        eq(dataSources.clientId, clientId),
        eq(dataSources.sourceType, "google_analytics")
      )
    );

  if (sources.length === 0) return [];

  const rawData = sources[0].rawData as Record<string, unknown> | null;
  if (!rawData) return [];

  // Extract from Analytics raw data structure (Phase 1 ingestion format)
  const topPages = (rawData.topPages ?? []) as Array<Record<string, unknown>>;
  const trafficSources = (rawData.trafficSources ?? []) as Array<
    Record<string, unknown>
  >;

  // Aggregate branded search (source=organic with brand-like queries)
  // and direct traffic from the ingested data
  const brandedVolume = trafficSources
    .filter((s) => s.source === "organic" || s.medium === "organic")
    .reduce((sum, s) => sum + Number(s.sessions ?? 0), 0);

  const directVolume = trafficSources
    .filter((s) => s.source === "(direct)" || s.medium === "(none)")
    .reduce((sum, s) => sum + Number(s.sessions ?? 0), 0);

  // Return as single data point (Phase 1 data is a snapshot, not time-series)
  // With real daily ingestion, this would return per-day data
  return [
    {
      date: new Date().toISOString().split("T")[0],
      brandedSearchVolume: brandedVolume,
      directTraffic: directVolume,
    },
  ];
}
