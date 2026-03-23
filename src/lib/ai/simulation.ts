import { writeFile, readFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import type {
  AIProvider,
  PresenceContent,
  MonitoringData,
  InsightReport,
  MultiLangContent,
  ProcessedResults,
  HealthReport,
  Anomaly,
  RawPlatformResponse,
  MonitoringQuery,
  MetaIntelligenceReport,
} from "./provider";
import type {
  RawClientData,
  KnowledgeGraphData,
  KGService,
  DecisionRadiusMap,
} from "@/lib/knowledge-graph/types";

const PROMPT_DIR = path.join(process.cwd(), "simulation", "prompts");
const RESPONSE_DIR = path.join(process.cwd(), "simulation", "responses");

async function ensureDirs() {
  if (!existsSync(PROMPT_DIR)) await mkdir(PROMPT_DIR, { recursive: true });
  if (!existsSync(RESPONSE_DIR)) await mkdir(RESPONSE_DIR, { recursive: true });
}

async function writePrompt(promptId: string, data: Record<string, unknown>) {
  await ensureDirs();
  const filePath = path.join(PROMPT_DIR, `${promptId}.json`);
  await writeFile(filePath, JSON.stringify(data, null, 2));
  return filePath;
}

async function waitForResponse<T>(promptId: string): Promise<T> {
  const filePath = path.join(RESPONSE_DIR, `${promptId}.json`);

  // In simulation mode, throw an informative error — the developer
  // processes the prompt manually via Claude Max and places the
  // response file.
  if (!existsSync(filePath)) {
    throw new Error(
      `[Simulation] Response not found: ${filePath}\n` +
        `Process the prompt at simulation/prompts/${promptId}.json ` +
        `and save the response to simulation/responses/${promptId}.json`
    );
  }

  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

export class SimulationProvider implements AIProvider {
  strategist = {
    async synthesizeKnowledgeGraph(
      rawData: RawClientData
    ): Promise<KnowledgeGraphData> {
      const promptId = `kg-synthesize-${rawData.clientId}`;
      await writePrompt(promptId, {
        task: "synthesize_knowledge_graph",
        tier: "strategist",
        input: rawData,
      });
      return waitForResponse<KnowledgeGraphData>(promptId);
    },

    async generatePresenceContent(
      kg: KnowledgeGraphData,
      formats: string[]
    ): Promise<PresenceContent[]> {
      const promptId = `presence-generate-${formats.join("-")}`;
      await writePrompt(promptId, {
        task: "generate_presence_content",
        tier: "strategist",
        input: { kg, formats },
      });
      return waitForResponse<PresenceContent[]>(promptId);
    },

    async generateInsightReport(
      kg: KnowledgeGraphData,
      monitoringData: MonitoringData
    ): Promise<InsightReport> {
      const promptId = `insight-report-${Date.now()}`;
      await writePrompt(promptId, {
        task: "generate_insight_report",
        tier: "strategist",
        input: { kg, monitoringData },
      });
      return waitForResponse<InsightReport>(promptId);
    },

    async classifyDecisionRadius(
      services: KGService[]
    ): Promise<DecisionRadiusMap> {
      const promptId = `decision-radius-${services.map((s) => s.id).join("-")}`;
      await writePrompt(promptId, {
        task: "classify_decision_radius",
        tier: "strategist",
        input: { services },
      });
      return waitForResponse<DecisionRadiusMap>(promptId);
    },

    async generateMultiLangContent(
      content: string,
      languages: string[]
    ): Promise<MultiLangContent> {
      const promptId = `multilang-${languages.join("-")}`;
      await writePrompt(promptId, {
        task: "generate_multilang_content",
        tier: "strategist",
        input: { content, languages },
      });
      return waitForResponse<MultiLangContent>(promptId);
    },
  };

  worker = {
    async processMonitoringResults(
      results: unknown[]
    ): Promise<ProcessedResults> {
      const promptId = `process-results-${Date.now()}`;
      await writePrompt(promptId, {
        task: "process_monitoring_results",
        tier: "worker",
        input: { results },
      });
      return waitForResponse<ProcessedResults>(promptId);
    },

    async evaluateContentHealth(
      deployments: unknown[]
    ): Promise<HealthReport> {
      const promptId = `content-health-${Date.now()}`;
      await writePrompt(promptId, {
        task: "evaluate_content_health",
        tier: "worker",
        input: { deployments },
      });
      return waitForResponse<HealthReport>(promptId);
    },

    async detectAnomalies(
      scores: unknown[],
      history: unknown[]
    ): Promise<Anomaly[]> {
      const promptId = `detect-anomalies-${Date.now()}`;
      await writePrompt(promptId, {
        task: "detect_anomalies",
        tier: "worker",
        input: { scores, history },
      });
      return waitForResponse<Anomaly[]>(promptId);
    },

    async handleMinorUpdate(
      change: Record<string, unknown>
    ): Promise<Record<string, unknown> | null> {
      const promptId = `minor-update-${Date.now()}`;
      await writePrompt(promptId, {
        task: "handle_minor_update",
        tier: "worker",
        input: { change },
      });
      return waitForResponse<Record<string, unknown> | null>(promptId);
    },

    async prepareEscalation(
      issue: Record<string, unknown>
    ): Promise<Record<string, unknown>> {
      const promptId = `escalation-${Date.now()}`;
      await writePrompt(promptId, {
        task: "prepare_escalation",
        tier: "worker",
        input: { issue },
      });
      return waitForResponse<Record<string, unknown>>(promptId);
    },
  };

  scout = {
    async queryPlatform(
      platform: string,
      query: string
    ): Promise<RawPlatformResponse> {
      const promptId = `scout-query-${platform}-${Date.now()}`;
      await writePrompt(promptId, {
        task: "query_platform",
        tier: "scout",
        input: { platform, query },
      });
      return waitForResponse<RawPlatformResponse>(promptId);
    },

    async batchQuery(
      queries: MonitoringQuery[],
      platform: string
    ): Promise<RawPlatformResponse[]> {
      const promptId = `scout-batch-${platform}-${Date.now()}`;
      await writePrompt(promptId, {
        task: "batch_query",
        tier: "scout",
        input: { queries, platform },
      });
      return waitForResponse<RawPlatformResponse[]>(promptId);
    },
  };

  meta = {
    async runCrossClientAnalysis(
      anonymizedData: Record<string, unknown>
    ): Promise<MetaIntelligenceReport> {
      const promptId = `meta-analysis-${Date.now()}`;
      await writePrompt(promptId, {
        task: "cross_client_analysis",
        tier: "meta",
        input: { anonymizedData },
      });
      return waitForResponse<MetaIntelligenceReport>(promptId);
    },
  };
}
