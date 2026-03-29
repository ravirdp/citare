import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/user";
import { db } from "@/lib/db/client";
import { dataSources } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/connections/status
 * Returns connected data sources for the current user's client.
 */
export async function GET() {
  try {
    const user = await requireAuth();

    if (!user.clientId) {
      return NextResponse.json({ sources: [] });
    }

    const sources = await db
      .select({
        sourceType: dataSources.sourceType,
        status: dataSources.status,
      })
      .from(dataSources)
      .where(eq(dataSources.clientId, user.clientId));

    return NextResponse.json({ sources });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
