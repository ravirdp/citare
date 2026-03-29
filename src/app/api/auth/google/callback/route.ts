import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, encryptTokens } from "@/lib/integrations/google/oauth";
import { db } from "@/lib/db/client";
import { dataSources } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { DataSourceType } from "@/types/database";

/** Maps the serviceId used in the onboarding UI to the database source type */
const SERVICE_TO_SOURCE_TYPE: Record<string, DataSourceType> = {
  ads: "google_ads",
  gbp: "gbp",
  "search-console": "search_console",
  analytics: "analytics",
};

const SYNC_FREQUENCY: Partial<Record<DataSourceType, number>> = {
  google_ads: 6,
  gbp: 12,
  search_console: 24,
  analytics: 24,
};

/**
 * GET /api/auth/google/callback
 * Handles the Google OAuth callback after user grants consent.
 * Creates the data_source row for the specific service that was authorized.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const stateRaw = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");

  // Parse state — supports new JSON format and legacy "clientId" / "clientId:serviceId" formats
  let clientId: string | null = null;
  let serviceId: string | null = null;
  let returnTo = "/overview";

  if (stateRaw) {
    try {
      const parsed = JSON.parse(stateRaw);
      clientId = parsed.clientId ?? null;
      serviceId = parsed.serviceId ?? null;
      returnTo = parsed.returnTo ?? "/overview";
    } catch {
      // Legacy format: "clientId" or "clientId:serviceId"
      const parts = stateRaw.split(":");
      clientId = parts[0] ?? null;
      serviceId = parts[1] ?? null;
    }
  }

  if (error) {
    const url = new URL(returnTo, request.url);
    url.searchParams.set("error", `Google OAuth denied: ${error}`);
    return NextResponse.redirect(url);
  }

  if (!code || !clientId) {
    return NextResponse.json(
      { error: "Missing code or state parameter" },
      { status: 400 }
    );
  }

  try {
    const tokens = await exchangeCode(code);
    const encryptedCredentials = encryptTokens(tokens);

    // Determine which source types to create
    const sourceTypes: DataSourceType[] = [];
    if (serviceId && SERVICE_TO_SOURCE_TYPE[serviceId]) {
      sourceTypes.push(SERVICE_TO_SOURCE_TYPE[serviceId]);
    } else {
      // Legacy fallback: create all source types
      sourceTypes.push("google_ads", "gbp", "search_console", "analytics");
    }

    for (const sourceType of sourceTypes) {
      const existing = await db
        .select()
        .from(dataSources)
        .where(
          and(
            eq(dataSources.clientId, clientId),
            eq(dataSources.sourceType, sourceType)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(dataSources)
          .set({
            credentials: encryptedCredentials,
            status: "connected",
          })
          .where(eq(dataSources.id, existing[0].id));
      } else {
        await db.insert(dataSources).values({
          clientId,
          sourceType,
          status: "connected",
          credentials: encryptedCredentials,
          syncFrequencyHours: SYNC_FREQUENCY[sourceType] ?? 24,
        });
      }
    }

    // Redirect back to the page that initiated the OAuth flow
    const url = new URL(returnTo, request.url);
    url.searchParams.set("connected", serviceId ?? "all");
    return NextResponse.redirect(url);
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    const url = new URL(returnTo, request.url);
    url.searchParams.set(
      "error",
      "Failed to connect Google account. Please try again."
    );
    return NextResponse.redirect(url);
  }
}
