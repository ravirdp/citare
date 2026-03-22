/**
 * AI Provider abstraction layer.
 *
 * All AI calls in Citare go through this interface. The active implementation
 * is selected by the AI_MODE env var:
 *   - "simulation" → SimulationProvider (prompts written to files)
 *   - "production" → ProductionProvider (real API calls)
 */

// ── Shared types (slim placeholders — flesh out as features are built) ──

export interface RawClientData {
  clientId: string;
  sources: Record<string, unknown>;
}

export interface KnowledgeGraph {
  businessProfile: Record<string, unknown>;
  services: unknown[];
  products: unknown[];
  competitors: unknown[];
}

export interface PresenceContent {
  format: string;
  language: string;
  content: string;
}

export interface MonitoringData {
  results: unknown[];
  dateRange: { from: string; to: string };
}

export interface InsightReport {
  summary: string;
  recommendations: unknown[];
}

export interface DecisionRadiusMap {
  [serviceId: string]: "planned" | "considered" | "impulse";
}

export interface MultiLangContent {
  [language: string]: string;
}

export interface ProcessedResults {
  processed: unknown[];
  anomalies: unknown[];
}

export interface HealthReport {
  healthy: boolean;
  issues: unknown[];
}

export interface Anomaly {
  type: string;
  details: Record<string, unknown>;
}

export interface RawPlatformResponse {
  platform: string;
  query: string;
  response: string;
  timestamp: string;
}

export interface MonitoringQuery {
  id: string;
  queryText: string;
  language: string;
}

export interface MetaIntelligenceReport {
  findings: unknown[];
  actionsTaken: unknown[];
  roadmapSuggestions: unknown[];
}

// ── The Provider Interface ──

export interface AIProvider {
  strategist: {
    synthesizeKnowledgeGraph(rawData: RawClientData): Promise<KnowledgeGraph>;
    generatePresenceContent(
      kg: KnowledgeGraph,
      formats: string[]
    ): Promise<PresenceContent[]>;
    generateInsightReport(
      kg: KnowledgeGraph,
      monitoringData: MonitoringData
    ): Promise<InsightReport>;
    classifyDecisionRadius(
      services: unknown[]
    ): Promise<DecisionRadiusMap>;
    generateMultiLangContent(
      content: string,
      languages: string[]
    ): Promise<MultiLangContent>;
  };

  worker: {
    processMonitoringResults(
      results: unknown[]
    ): Promise<ProcessedResults>;
    evaluateContentHealth(
      deployments: unknown[]
    ): Promise<HealthReport>;
    detectAnomalies(
      scores: unknown[],
      history: unknown[]
    ): Promise<Anomaly[]>;
    handleMinorUpdate(
      change: Record<string, unknown>
    ): Promise<Record<string, unknown> | null>;
    prepareEscalation(
      issue: Record<string, unknown>
    ): Promise<Record<string, unknown>>;
  };

  scout: {
    queryPlatform(
      platform: string,
      query: string
    ): Promise<RawPlatformResponse>;
    batchQuery(
      queries: MonitoringQuery[],
      platform: string
    ): Promise<RawPlatformResponse[]>;
  };

  meta: {
    runCrossClientAnalysis(
      anonymizedData: Record<string, unknown>
    ): Promise<MetaIntelligenceReport>;
  };
}

// ── Provider factory ──

let _provider: AIProvider | null = null;

export async function getAIProvider(): Promise<AIProvider> {
  if (_provider) return _provider;

  const mode = process.env.AI_MODE ?? "simulation";

  if (mode === "production") {
    const { ProductionProvider } = await import("./production");
    _provider = new ProductionProvider();
  } else {
    const { SimulationProvider } = await import("./simulation");
    _provider = new SimulationProvider();
  }

  return _provider;
}
