import { db } from "@/lib/db/client";
import { dataSources } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { decryptTokens, encryptTokens, getValidTokens } from "./google/oauth";
import { GoogleAdsIntegration } from "./google/ads";
import { GbpIntegration } from "./google/gbp";
import { SearchConsoleIntegration } from "./google/search-console";
import { AnalyticsIntegration } from "./google/analytics";
import type { DataSourceIntegration } from "./_template";
import type { EncryptedCredentials } from "@/types/integrations";

const INTEGRATIONS: Record<string, DataSourceIntegration> = {
  google_ads: new GoogleAdsIntegration(),
  gbp: new GbpIntegration(),
  search_console: new SearchConsoleIntegration(),
  analytics: new AnalyticsIntegration(),
};

/**
 * Run data ingestion for all connected data sources of a client.
 * Each source runs independently — if one fails, others continue.
 */
export async function ingestClient(clientId: string) {
  const sources = await db
    .select()
    .from(dataSources)
    .where(eq(dataSources.clientId, clientId));

  const eligibleSources = sources.filter(
    (s) => s.status === "connected" || s.status === "active"
  );

  const results = await Promise.allSettled(
    eligibleSources.map(async (source) => {
      const integration = INTEGRATIONS[source.sourceType];
      if (!integration) {
        throw new Error(`No integration for source type: ${source.sourceType}`);
      }

      // Mark as syncing
      await db
        .update(dataSources)
        .set({ status: "syncing" })
        .where(eq(dataSources.id, source.id));

      try {
        // Decrypt credentials
        const credentials = source.credentials as unknown as EncryptedCredentials;
        let tokens = decryptTokens(credentials);

        // Refresh tokens if needed
        tokens = await getValidTokens(tokens);

        // Re-encrypt refreshed tokens
        const encryptedRefreshed = encryptTokens(tokens);

        // Fetch data
        const rawData = await integration.fetchData(
          tokens,
          (source.metadata as Record<string, unknown>) || {}
        );

        // Update data source with results
        await db
          .update(dataSources)
          .set({
            rawData: rawData as unknown as Record<string, unknown>,
            credentials: encryptedRefreshed as unknown as Record<string, unknown>,
            status: rawData.partial ? "active" : "active",
            lastSyncAt: new Date(),
            nextSyncAt: new Date(
              Date.now() + (source.syncFrequencyHours || 6) * 60 * 60 * 1000
            ),
          })
          .where(eq(dataSources.id, source.id));

        return { sourceType: source.sourceType, success: true };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);

        // Log error but don't crash
        const currentErrors = (source.errorLog as unknown[]) || [];
        const updatedErrors = [
          ...currentErrors.slice(-9), // Keep last 9 errors
          { timestamp: new Date().toISOString(), message: errorMessage },
        ];

        await db
          .update(dataSources)
          .set({
            status: "error",
            errorLog: updatedErrors as unknown as Record<string, unknown>,
          })
          .where(eq(dataSources.id, source.id));

        throw err;
      }
    })
  );

  return results.map((result, index) => ({
    sourceType: eligibleSources[index].sourceType,
    status: result.status === "fulfilled" ? "success" : "error",
    error:
      result.status === "rejected"
        ? result.reason instanceof Error
          ? result.reason.message
          : String(result.reason)
        : null,
  }));
}
