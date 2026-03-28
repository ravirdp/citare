import { db } from "@/lib/db/client";
import { visibilityScores } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { collectTrafficData } from "./traffic-collector";
import { collectActionData } from "./action-collector";
import {
  computeTimelagCorrelation,
  assessSignificance,
} from "./correlation";
import type { AISearchImpactScore, CorrelationResult } from "./types";

// Signal weights
const VISIBILITY_WEIGHT = 0.4;
const TRAFFIC_WEIGHT = 0.25;
const ACTIONS_WEIGHT = 0.25;
const SURVEY_WEIGHT = 0.1;

/**
 * Compute the AI Search Impact Score for a client.
 */
export async function computeAttributionForClient(
  clientId: string
): Promise<AISearchImpactScore> {
  // Load visibility score history
  const scores = await db
    .select()
    .from(visibilityScores)
    .where(eq(visibilityScores.clientId, clientId))
    .orderBy(desc(visibilityScores.date))
    .limit(30);

  if (scores.length === 0) {
    return emptyImpactScore("No visibility data available");
  }

  const latest = scores[0];
  const visibilityValue = parseFloat(latest.overallScore ?? "0");
  const adSpendValue = parseFloat(latest.gadsEquivalentValueInr ?? "0");
  const visibilitySeries = scores
    .reverse()
    .map((s) => parseFloat(s.overallScore ?? "0"));

  // Collect attribution signals
  const [trafficData, actionData] = await Promise.allSettled([
    collectTrafficData(clientId),
    collectActionData(clientId),
  ]);

  const traffic =
    trafficData.status === "fulfilled" ? trafficData.value : [];
  const actions =
    actionData.status === "fulfilled" ? actionData.value : [];

  // Build signal breakdown
  const signals = [
    {
      signal: "AI Visibility",
      weight: VISIBILITY_WEIGHT,
      value: visibilityValue,
      available: true,
    },
    {
      signal: "Traffic Correlation",
      weight: TRAFFIC_WEIGHT,
      value: traffic.length > 0 ? traffic[0].brandedSearchVolume : 0,
      available: traffic.length > 0,
    },
    {
      signal: "Action Correlation",
      weight: ACTIONS_WEIGHT,
      value:
        actions.length > 0
          ? actions[0].calls + actions[0].directions + actions[0].websiteClicks
          : 0,
      available: actions.length > 0,
    },
    {
      signal: "Discovery Survey",
      weight: SURVEY_WEIGHT,
      value: 0,
      available: false, // Not yet implemented
    },
  ];

  // Compute correlations (only meaningful with time-series data)
  const correlations: CorrelationResult[] = [];

  if (traffic.length >= 3 && visibilitySeries.length >= 3) {
    const trafficSeries = traffic.map((t) => t.brandedSearchVolume);
    const { coefficient, lag } = computeTimelagCorrelation(
      visibilitySeries,
      trafficSeries
    );
    correlations.push({
      signalPair: "aiVisibility-brandedSearch",
      correlationCoefficient: Math.round(coefficient * 100) / 100,
      timelagDays: lag,
      dataPoints: Math.min(visibilitySeries.length, trafficSeries.length),
      significance: assessSignificance(
        coefficient,
        Math.min(visibilitySeries.length, trafficSeries.length)
      ),
    });
  }

  if (actions.length >= 3 && visibilitySeries.length >= 3) {
    const actionSeries = actions.map(
      (a) => a.calls + a.directions + a.websiteClicks
    );
    const { coefficient, lag } = computeTimelagCorrelation(
      visibilitySeries,
      actionSeries
    );
    correlations.push({
      signalPair: "aiVisibility-gbpActions",
      correlationCoefficient: Math.round(coefficient * 100) / 100,
      timelagDays: lag,
      dataPoints: Math.min(visibilitySeries.length, actionSeries.length),
      significance: assessSignificance(
        coefficient,
        Math.min(visibilitySeries.length, actionSeries.length)
      ),
    });
  }

  // Composite score — weighted sum of available signals (normalized to 100)
  const availableWeight = signals
    .filter((s) => s.available)
    .reduce((sum, s) => sum + s.weight, 0);

  const compositeScore =
    availableWeight > 0
      ? Math.round(
          signals
            .filter((s) => s.available)
            .reduce(
              (sum, s) => sum + (s.value / 100) * (s.weight / availableWeight),
              0
            ) * 100
        )
      : 0;

  // Monthly touchpoints = mentions extrapolated to 30 days
  const monthlyTouchpoints = Math.round(
    (visibilityValue / 100) * scores.length * 30
  );

  // Confidence based on data availability
  const availableSignals = signals.filter((s) => s.available).length;
  const confidence: AISearchImpactScore["confidence"] =
    availableSignals >= 3
      ? "high"
      : availableSignals >= 2
        ? "medium"
        : "low";

  const insufficientCorrelations = correlations.every(
    (c) => c.significance === "insufficient_data" || c.significance === "weak"
  );

  return {
    compositeScore,
    monthlyTouchpoints,
    equivalentAdSpendInr: adSpendValue,
    signalBreakdown: signals,
    correlations,
    confidence,
    dataStatus: insufficientCorrelations
      ? "Not enough data yet — meaningful correlations require 2+ weeks of real monitoring data"
      : `Based on ${scores.length} day(s) of monitoring data`,
  };
}

function emptyImpactScore(reason: string): AISearchImpactScore {
  return {
    compositeScore: 0,
    monthlyTouchpoints: 0,
    equivalentAdSpendInr: 0,
    signalBreakdown: [
      { signal: "AI Visibility", weight: 0.4, value: 0, available: false },
      { signal: "Traffic Correlation", weight: 0.25, value: 0, available: false },
      { signal: "Action Correlation", weight: 0.25, value: 0, available: false },
      { signal: "Discovery Survey", weight: 0.1, value: 0, available: false },
    ],
    correlations: [],
    confidence: "low",
    dataStatus: reason,
  };
}
