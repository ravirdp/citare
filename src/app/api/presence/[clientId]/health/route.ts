import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { presenceDeployments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { jsonLdGenerator } from "@/lib/presence/json-ld";
import { llmsTxtGenerator } from "@/lib/presence/llms-txt";
import { faqGenerator } from "@/lib/presence/faq";
import { markdownGenerator } from "@/lib/presence/markdown";
import { productFeedGenerator } from "@/lib/presence/product-feed";
import type { PresenceGenerator } from "@/lib/presence/types";

const VALIDATORS: Record<string, PresenceGenerator> = {
  json_ld: jsonLdGenerator,
  llms_txt: llmsTxtGenerator,
  faq_page: faqGenerator,
  markdown_page: markdownGenerator,
  product_feed: productFeedGenerator,
};

/**
 * GET /api/presence/:clientId/health
 * Validate all deployed presence content for a client.
 */
export async function GET(
  _request: NextRequest,
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

  const deployments = await db
    .select()
    .from(presenceDeployments)
    .where(eq(presenceDeployments.clientId, clientId));

  const healthResults = deployments.map((deployment) => {
    const validator = VALIDATORS[deployment.format];
    const hasContent = !!deployment.content && deployment.content.length > 0;

    let validation = { valid: false, errors: ["No validator for format"] };
    if (validator && hasContent) {
      validation = validator.validate(deployment.content!);
    } else if (!hasContent) {
      validation = { valid: false, errors: ["No content"] };
    }

    const healthCheck = {
      format: deployment.format,
      language: deployment.language,
      status: deployment.status,
      deploymentUrl: deployment.deploymentUrl,
      hasContent,
      valid: validation.valid,
      errors: validation.errors,
      lastDeployedAt: deployment.lastDeployedAt,
      checkedAt: new Date().toISOString(),
    };

    // Update health check in DB (fire-and-forget)
    db.update(presenceDeployments)
      .set({
        healthCheck: healthCheck as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .where(eq(presenceDeployments.id, deployment.id))
      .then(() => {})
      .catch(() => {});

    return healthCheck;
  });

  const overallHealthy = healthResults.every(
    (r) => r.valid && r.status === "deployed"
  );

  return NextResponse.json({
    healthy: overallHealthy,
    deployments: healthResults,
  });
}
