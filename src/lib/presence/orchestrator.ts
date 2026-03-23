import { createHash } from "crypto";
import { db } from "@/lib/db/client";
import { presenceDeployments, clients } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getKnowledgeGraph } from "@/lib/knowledge-graph/queries";
import { jsonLdGenerator } from "./json-ld";
import { llmsTxtGenerator } from "./llms-txt";
import { faqGenerator } from "./faq";
import { markdownGenerator } from "./markdown";
import { productFeedGenerator } from "./product-feed";
import type { KnowledgeGraphData } from "@/lib/knowledge-graph/types";
import type { PresenceGenerator, ClientRecord, PresenceFormat, GenerationResult } from "./types";

const GENERATORS: Record<PresenceFormat, PresenceGenerator> = {
  json_ld: jsonLdGenerator,
  llms_txt: llmsTxtGenerator,
  faq_page: faqGenerator,
  markdown_page: markdownGenerator,
  product_feed: productFeedGenerator,
};

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Generate presence content for a client across all formats.
 * Compares content hashes to avoid unnecessary updates.
 */
export async function generatePresenceContent(
  clientId: string,
  formats?: PresenceFormat[]
): Promise<GenerationResult[]> {
  // Fetch KG
  const kgRow = await getKnowledgeGraph(clientId);
  if (!kgRow) {
    throw new Error("Knowledge graph not found. Run synthesis first.");
  }

  // Fetch client record
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);

  if (!client) {
    throw new Error(`Client not found: ${clientId}`);
  }

  const clientRecord: ClientRecord = {
    id: client.id,
    slug: client.slug,
    name: client.name,
    businessType: client.businessType,
    languages: (client.languages as string[]) ?? ["en"],
  };

  const kg: KnowledgeGraphData = {
    businessProfile: kgRow.businessProfile as KnowledgeGraphData["businessProfile"],
    services: kgRow.services as KnowledgeGraphData["services"],
    products: kgRow.products as KnowledgeGraphData["products"],
    competitors: kgRow.competitors as KnowledgeGraphData["competitors"],
    presenceState: kgRow.presenceState as KnowledgeGraphData["presenceState"],
    searchState: kgRow.searchState as KnowledgeGraphData["searchState"],
    decisionRadiusMap: kgRow.decisionRadiusMap as KnowledgeGraphData["decisionRadiusMap"],
    confidenceScores: kgRow.confidenceScores as KnowledgeGraphData["confidenceScores"],
    conflicts: kgRow.conflicts as KnowledgeGraphData["conflicts"],
  };

  const targetFormats = formats ?? (Object.keys(GENERATORS) as PresenceFormat[]);
  const language = "en"; // Primary language; multi-lang handled separately

  const results = await Promise.allSettled(
    targetFormats.map(async (format): Promise<GenerationResult> => {
      const generator = GENERATORS[format];
      if (!generator) {
        return { format, language, content: "", contentHash: "", status: "error", error: `Unknown format: ${format}` };
      }

      try {
        const content = generator.generate(kg, clientRecord, language);
        const contentHash = hashContent(content);

        // Check existing deployment
        const [existing] = await db
          .select()
          .from(presenceDeployments)
          .where(
            and(
              eq(presenceDeployments.clientId, clientId),
              eq(presenceDeployments.format, format),
              eq(presenceDeployments.language, language)
            )
          )
          .limit(1);

        if (existing && existing.contentHash === contentHash) {
          return { format, language, content: "", contentHash, status: "unchanged" };
        }

        // Upsert
        if (existing) {
          await db
            .update(presenceDeployments)
            .set({
              content,
              contentHash,
              status: "draft",
              updatedAt: new Date(),
            })
            .where(eq(presenceDeployments.id, existing.id));
        } else {
          await db.insert(presenceDeployments).values({
            clientId,
            format,
            language,
            deploymentMethod: "hosted_profile",
            content,
            contentHash,
            status: "draft",
          });
        }

        return { format, language, content, contentHash, status: "generated" };
      } catch (err) {
        return {
          format,
          language,
          content: "",
          contentHash: "",
          status: "error",
          error: err instanceof Error ? err.message : String(err),
        };
      }
    })
  );

  return results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : { format: "json_ld" as PresenceFormat, language, content: "", contentHash: "", status: "error" as const, error: String(r.reason) }
  );
}
