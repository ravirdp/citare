import type {
  AIProvider,
  RawClientData,
  KnowledgeGraph,
  PresenceContent,
  MonitoringData,
  InsightReport,
  DecisionRadiusMap,
  MultiLangContent,
  ProcessedResults,
  HealthReport,
  Anomaly,
  RawPlatformResponse,
  MonitoringQuery,
  MetaIntelligenceReport,
} from "./provider";

/**
 * Production AI provider — makes real API calls to Anthropic, OpenAI, etc.
 * Stub implementation; will be built out when moving to production mode.
 */
export class ProductionProvider implements AIProvider {
  strategist = {
    async synthesizeKnowledgeGraph(
      _rawData: RawClientData
    ): Promise<KnowledgeGraph> {
      throw new Error("ProductionProvider.strategist not yet implemented");
    },
    async generatePresenceContent(
      _kg: KnowledgeGraph,
      _formats: string[]
    ): Promise<PresenceContent[]> {
      throw new Error("ProductionProvider.strategist not yet implemented");
    },
    async generateInsightReport(
      _kg: KnowledgeGraph,
      _monitoringData: MonitoringData
    ): Promise<InsightReport> {
      throw new Error("ProductionProvider.strategist not yet implemented");
    },
    async classifyDecisionRadius(
      _services: unknown[]
    ): Promise<DecisionRadiusMap> {
      throw new Error("ProductionProvider.strategist not yet implemented");
    },
    async generateMultiLangContent(
      _content: string,
      _languages: string[]
    ): Promise<MultiLangContent> {
      throw new Error("ProductionProvider.strategist not yet implemented");
    },
  };

  worker = {
    async processMonitoringResults(
      _results: unknown[]
    ): Promise<ProcessedResults> {
      throw new Error("ProductionProvider.worker not yet implemented");
    },
    async evaluateContentHealth(
      _deployments: unknown[]
    ): Promise<HealthReport> {
      throw new Error("ProductionProvider.worker not yet implemented");
    },
    async detectAnomalies(
      _scores: unknown[],
      _history: unknown[]
    ): Promise<Anomaly[]> {
      throw new Error("ProductionProvider.worker not yet implemented");
    },
    async handleMinorUpdate(
      _change: Record<string, unknown>
    ): Promise<Record<string, unknown> | null> {
      throw new Error("ProductionProvider.worker not yet implemented");
    },
    async prepareEscalation(
      _issue: Record<string, unknown>
    ): Promise<Record<string, unknown>> {
      throw new Error("ProductionProvider.worker not yet implemented");
    },
  };

  scout = {
    async queryPlatform(
      _platform: string,
      _query: string
    ): Promise<RawPlatformResponse> {
      throw new Error("ProductionProvider.scout not yet implemented");
    },
    async batchQuery(
      _queries: MonitoringQuery[],
      _platform: string
    ): Promise<RawPlatformResponse[]> {
      throw new Error("ProductionProvider.scout not yet implemented");
    },
  };

  meta = {
    async runCrossClientAnalysis(
      _anonymizedData: Record<string, unknown>
    ): Promise<MetaIntelligenceReport> {
      throw new Error("ProductionProvider.meta not yet implemented");
    },
  };
}
