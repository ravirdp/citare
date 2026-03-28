import type { PlatformScores } from "@/types/monitoring";

export interface AttributionSignals {
  aiVisibility: {
    score: number;
    date: string;
    platformBreakdown: PlatformScores;
  };
  trafficCorrelation: {
    brandedSearchVolume: number;
    directTraffic: number;
    date: string;
  } | null;
  actionCorrelation: {
    calls: number;
    directions: number;
    websiteClicks: number;
    date: string;
  } | null;
  discoverySurvey: {
    totalResponses: number;
    aiAssisted: number;
  } | null;
}

export interface CorrelationResult {
  signalPair: string;
  correlationCoefficient: number;
  timelagDays: number;
  dataPoints: number;
  significance: "strong" | "moderate" | "weak" | "insufficient_data";
}

export interface AISearchImpactScore {
  compositeScore: number;
  monthlyTouchpoints: number;
  equivalentAdSpendInr: number;
  signalBreakdown: Array<{
    signal: string;
    weight: number;
    value: number;
    available: boolean;
  }>;
  correlations: CorrelationResult[];
  confidence: "high" | "medium" | "low";
  dataStatus: string;
}
