import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, encryptTokens } from "@/lib/integrations/google/oauth";
import { db } from "@/lib/db/client";
import { dataSources } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { DataSourceType } from "@/types/database";

const SOURCE_TYPES: DataSourceType[] = [
  "google_ads",
  "gbp",
  "search_console",
  "analytics",
];

/**
 * GET /api/auth/google/callback
 * Handles the Google OAuth callback after user grants consent.
 * Creates data_source rows for each Google API.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state"); // clientId
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    const url = new URL("/overview", request.url);
    url.searchParams.set("error", `Google OAuth denied: ${error}`);
    return NextResponse.redirect(url);
  }

  if (!code || !state) {
    return NextResponse.json(
      { error: "Missing code or state parameter" },
      { status: 400 }
    );
  }

  const clientId = state;

  try {
    // Exchange authorization code for tokens
    const tokens = await exchangeCode(code);
    const encryptedCredentials = encryptTokens(tokens);

    // Create or update data_source rows for each Google API
    for (const sourceType of SOURCE_TYPES) {
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
          syncFrequencyHours: sourceType === "google_ads" ? 6 :
            sourceType === "gbp" ? 12 : 24,
        });
      }
    }

    // Redirect back to admin clients page
    const url = new URL("/overview", request.url);
    url.searchParams.set("success", "Google account connected");
    return NextResponse.redirect(url);
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    const url = new URL("/overview", request.url);
    url.searchParams.set(
      "error",
      "Failed to connect Google account. Please try again."
    );
    return NextResponse.redirect(url);
  }
}
