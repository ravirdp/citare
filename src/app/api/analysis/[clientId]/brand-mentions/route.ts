import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { clients, knowledgeGraphs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { scanBrandMentions } from "@/lib/analysis/brand-mentions";

/**
 * GET /api/analysis/:clientId/brand-mentions
 * Returns brand mention report for the client.
 *
 * POST /api/analysis/:clientId/brand-mentions
 * Trigger a new brand mention scan.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;
  const result = await runBrandScan(clientId);
  if ("error" in result) {
    return NextResponse.json(result, { status: result.status ?? 400 });
  }
  return NextResponse.json(result);
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;
  const result = await runBrandScan(clientId);
  if ("error" in result) {
    return NextResponse.json(result, { status: result.status ?? 400 });
  }
  return NextResponse.json(result);
}

async function runBrandScan(clientId: string) {
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);

  if (!client) {
    return { error: "Client not found", status: 404 };
  }

  const [kg] = await db
    .select()
    .from(knowledgeGraphs)
    .where(eq(knowledgeGraphs.clientId, clientId))
    .limit(1);

  const profile = kg?.businessProfile as Record<string, unknown> | null;
  const domain = (profile?.website as string) ?? (profile?.domain as string);
  const competitorNames = ((kg?.competitors ?? []) as Array<{ name?: string }>)
    .map((c) => c.name)
    .filter((n): n is string => !!n)
    .slice(0, 5);

  return scanBrandMentions(client.name, {
    domain: domain ?? undefined,
    includeIndianPlatforms: true,
    competitorNames,
  });
}
