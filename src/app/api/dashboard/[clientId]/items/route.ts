import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { visibilityScores } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getKnowledgeGraph } from "@/lib/knowledge-graph/queries";
import type { KnowledgeGraphData, KGService, KGProduct } from "@/lib/knowledge-graph/types";
import type { ItemScore } from "@/types/monitoring";

/**
 * GET /api/dashboard/:clientId/items
 * Per-service/product visibility scores.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;

  // Get latest visibility score for item breakdowns
  const [latest] = await db
    .select()
    .from(visibilityScores)
    .where(eq(visibilityScores.clientId, clientId))
    .orderBy(desc(visibilityScores.date))
    .limit(1);

  const rawItems = (latest?.itemScores ?? []) as unknown as ItemScore[];

  // Enrich with KG names
  const kgRow = await getKnowledgeGraph(clientId);
  const services = (kgRow?.services ?? []) as KGService[];
  const products = (kgRow?.products ?? []) as KGProduct[];

  const items = rawItems.map((item) => {
    let name = item.itemName;
    if (item.itemType === "service") {
      const svc = services.find((s) => s.id === item.itemId);
      if (svc) name = svc.name;
    } else {
      const prod = products.find((p) => p.id === item.itemId);
      if (prod) name = prod.name;
    }
    return { ...item, itemName: name };
  });

  return NextResponse.json({ items });
}
