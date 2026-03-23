import { db } from "@/lib/db/client";
import { dataSources, clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAIProvider } from "@/lib/ai/provider";
import { getKnowledgeGraph } from "./queries";
import { createKnowledgeGraph, updateKnowledgeGraph } from "./builder";
import type { RawClientData, KnowledgeGraphData } from "./types";

interface SynthesisResult {
  status: "created" | "updated" | "awaiting_simulation" | "error";
  knowledgeGraphId?: string;
  version?: number;
  promptPath?: string;
  error?: string;
}

/**
 * Assemble raw data from all data sources for a client.
 */
async function assembleRawClientData(
  clientId: string
): Promise<RawClientData> {
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);

  if (!client) {
    throw new Error(`Client not found: ${clientId}`);
  }

  const sources = await db
    .select()
    .from(dataSources)
    .where(eq(dataSources.clientId, clientId));

  const activeSources = sources.filter(
    (s) => s.status === "active" || s.status === "connected"
  );

  if (activeSources.length === 0) {
    throw new Error(
      "No ingested data found. Run ingestion first."
    );
  }

  const rawData: RawClientData = {
    clientId,
    clientName: client.name,
    businessType: client.businessType,
    landmarkDescription: client.landmarkDescription,
    languages: (client.languages as string[]) ?? ["en"],
    sources: {},
  };

  for (const source of activeSources) {
    const data = source.rawData as Record<string, unknown>;
    switch (source.sourceType) {
      case "google_ads":
        rawData.sources.googleAds = data;
        break;
      case "gbp":
        rawData.sources.gbp = data;
        break;
      case "search_console":
        rawData.sources.searchConsole = data;
        break;
      case "analytics":
        rawData.sources.analytics = data;
        break;
    }
  }

  return rawData;
}

/**
 * Synthesize a knowledge graph for a client from raw data sources.
 *
 * In simulation mode, this writes a prompt file and returns
 * 'awaiting_simulation' — the developer processes it manually.
 * On subsequent calls (after placing the response file), it
 * reads the response and creates/updates the KG.
 */
export async function synthesizeKnowledgeGraph(
  clientId: string
): Promise<SynthesisResult> {
  try {
    const rawData = await assembleRawClientData(clientId);
    const aiProvider = await getAIProvider();

    let kgData: KnowledgeGraphData;
    try {
      kgData = await aiProvider.strategist.synthesizeKnowledgeGraph(rawData);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.includes("[Simulation] Response not found")
      ) {
        // Extract prompt path from the error message
        const match = err.message.match(
          /simulation\/prompts\/(.+\.json)/
        );
        const promptPath = match
          ? `simulation/prompts/${match[1]}`
          : "simulation/prompts/";

        return {
          status: "awaiting_simulation",
          promptPath,
        };
      }
      throw err;
    }

    // Check if a KG already exists for this client
    const existingKg = await getKnowledgeGraph(clientId);

    if (existingKg) {
      const updated = await updateKnowledgeGraph(
        existingKg.id,
        kgData,
        "tier_one",
        "Re-synthesis from updated raw data"
      );
      return {
        status: "updated",
        knowledgeGraphId: updated.id,
        version: updated.version ?? undefined,
      };
    }

    const created = await createKnowledgeGraph(clientId, kgData);
    return {
      status: "created",
      knowledgeGraphId: created.id,
      version: created.version ?? undefined,
    };
  } catch (err) {
    return {
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
