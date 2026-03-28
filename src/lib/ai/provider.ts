/**
 * AI Provider abstraction layer.
 *
 * All AI calls in Citare go through this interface. The active implementation
 * is selected by the AI_MODE env var:
 *   - "simulation" → SimulationProvider (prompts written to files)
 *   - "production" → ProductionProvider (real API calls)
 */

// ── Core types (re-exported from knowledge-graph/types.ts) ──

export type {
  RawClientData,
  KnowledgeGraphData,
  KGService,
  KGProduct,
  DecisionRadiusMap,
  MultiLangObject,
} from "@/lib/knowledge-graph/types";

import type {
  RawClientData as _RawClientData,
  KnowledgeGraphData as _KnowledgeGraphData,
  KGService as _KGService,
  DecisionRadiusMap as _DecisionRadiusMap,
} from "@/lib/knowledge-graph/types";

// ── Shared types ──

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
    synthesizeKnowledgeGraph(rawData: _RawClientData): Promise<_KnowledgeGraphData>;
    generatePresenceContent(
      kg: _KnowledgeGraphData,
      formats: string[]
    ): Promise<PresenceContent[]>;
    generateInsightReport(
      kg: _KnowledgeGraphData,
      monitoringData: MonitoringData
    ): Promise<InsightReport>;
    classifyDecisionRadius(
      services: _KGService[]
    ): Promise<_DecisionRadiusMap>;
    generateMultiLangContent(
      content: string,
      languages: string[]
    ): Promise<MultiLangContent>;
    generateRecommendations(
      kg: _KnowledgeGraphData,
      monitoringData: MonitoringData,
      scores: Record<string, unknown>
    ): Promise<Array<{
      type: string;
      priority: string;
      title: string;
      description: string;
      actionData: Record<string, unknown>;
    }>>;
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

  return _provider!;
}
