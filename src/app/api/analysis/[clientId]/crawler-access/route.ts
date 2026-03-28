import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { clients, knowledgeGraphs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { analyzeCrawlerAccess } from "@/lib/analysis/crawler-access";

/**
 * GET /api/analysis/:clientId/crawler-access
 * Fetch and analyze robots.txt for the client's website domain.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;

  // Get domain from KG business profile or client metadata
  const [kg] = await db
    .select()
    .from(knowledgeGraphs)
    .where(eq(knowledgeGraphs.clientId, clientId))
    .limit(1);

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Try to extract domain from KG business profile or client metadata
  const profile = kg?.businessProfile as Record<string, unknown> | null;
  const website = (profile?.website as string)
    ?? (profile?.domain as string)
    ?? ((client.metadata as Record<string, unknown>)?.website as string);

  if (!website) {
    return NextResponse.json(
      { error: "No website domain found. Add a website URL to the client or knowledge graph." },
      { status: 400 }
    );
  }

  // Extract domain from URL
  let domain: string;
  try {
    const url = website.startsWith("http") ? website : `https://${website}`;
    domain = new URL(url).hostname;
  } catch {
    domain = website.replace(/^https?:\/\//, "").split("/")[0];
  }

  const report = await analyzeCrawlerAccess(domain);

  return NextResponse.json(report);
}
