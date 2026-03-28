import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runMonitoringForClient } from "@/lib/monitoring/runner";
import { getSubscriptionForClient } from "@/lib/billing/guards";
import { db } from "@/lib/db/client";
import { monitoringResults } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * POST /api/monitor/run/:clientId — Trigger monitoring for one client.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;

  // Check subscription
  const sub = await getSubscriptionForClient(clientId);
  if (!sub) {
    return NextResponse.json(
      { error: "No subscription found. Please select a plan.", upgrade_url: "/select-plan" },
      { status: 403 }
    );
  }

  const isActive = sub.status === "active" || (sub.status === "trialing" && (!sub.trialEnd || sub.trialEnd.getTime() > Date.now()));
  if (!isActive) {
    return NextResponse.json(
      { error: "Subscription expired. Please upgrade.", upgrade_url: "/billing" },
      { status: 403 }
    );
  }

  // Check monitoring frequency
  if (sub.monitoringFrequency === "every_3_days") {
    const [lastResult] = await db
      .select({ queriedAt: monitoringResults.queriedAt })
      .from(monitoringResults)
      .where(eq(monitoringResults.clientId, clientId))
      .orderBy(desc(monitoringResults.queriedAt))
      .limit(1);

    if (lastResult?.queriedAt) {
      const hoursSinceLast = (Date.now() - lastResult.queriedAt.getTime()) / 3600000;
      if (hoursSinceLast < 72) {
        return NextResponse.json(
          { error: `Monitoring runs every 3 days. Next run available in ${Math.ceil(72 - hoursSinceLast)} hours. Upgrade to daily monitoring for ₹1,500/month.`, upgrade_url: "/billing" },
          { status: 429 }
        );
      }
    }
  }

  try {
    const result = await runMonitoringForClient(clientId);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
