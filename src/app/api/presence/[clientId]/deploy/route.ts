import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { presenceDeployments, clients } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * POST /api/presence/:clientId/deploy
 * Flip status from 'draft' to 'deployed', set deployment URLs.
 * Optional body: { formats?: string[] }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = await params;

  try {
    // Get client slug for deployment URLs
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    let formatFilter: string[] | undefined;
    try {
      const body = await request.json();
      if (body.formats) formatFilter = body.formats;
    } catch {
      // No body — deploy all drafts
    }

    // Get draft deployments
    const drafts = await db
      .select()
      .from(presenceDeployments)
      .where(
        and(
          eq(presenceDeployments.clientId, clientId),
          eq(presenceDeployments.status, "draft")
        )
      );

    const toDeploy = formatFilter
      ? drafts.filter((d) => formatFilter!.includes(d.format))
      : drafts;

    if (toDeploy.length === 0) {
      return NextResponse.json(
        { success: false, error: "No draft deployments to deploy" },
        { status: 200 }
      );
    }

    const formatToPath: Record<string, string> = {
      json_ld: "json-ld",
      llms_txt: "llms.txt",
      faq_page: "faq",
      markdown_page: "about",
      product_feed: "products",
    };

    const deployed: string[] = [];

    for (const deployment of toDeploy) {
      const pathSegment = formatToPath[deployment.format] ?? deployment.format;
      const deploymentUrl = `/presence/${client.slug}/${pathSegment}`;

      await db
        .update(presenceDeployments)
        .set({
          status: "deployed",
          deploymentUrl,
          lastDeployedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(presenceDeployments.id, deployment.id));

      deployed.push(deployment.format);
    }

    return NextResponse.json({
      success: true,
      deployed,
      slug: client.slug,
    });
  } catch (err) {
    console.error("Presence deploy error:", err);
    return NextResponse.json(
      {
        error: "Deployment failed",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
