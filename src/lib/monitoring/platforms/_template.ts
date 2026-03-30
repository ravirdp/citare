import type { Platform, NormalizedResult, CompetitorMention } from "@/types/monitoring";

/**
 * Platform adapter interface.
 * Each AI platform (ChatGPT, Perplexity, etc.) implements this.
 */
export interface PlatformAdapter {
  platform: Platform;
  queryPlatform(query: string, clientName: string, competitorNames?: string[]): Promise<NormalizedResult>;
  isAvailable(): boolean;
}

// ── Simulation helpers ──

const SIMULATION_COMPETITORS = [
  "MediBuddy",
  "Practo",
  "Apollo 24|7",
  "Tata 1mg",
  "PharmEasy",
  "Urban Company",
  "Justdial",
  "Sulekha",
];

/**
 * Create a deterministic simulation result seeded by platform + query.
 * Same inputs always produce same outputs for reproducible debugging.
 */
export function createSimulationResult(
  platform: Platform,
  query: string,
  clientName: string
): NormalizedResult {
  const seed = hashCode(`${platform}:${query}`);

  const mentioned = (seed % 100) < 60; // ~60% mention rate
  const position = mentioned ? ((seed % 5) + 1) : null; // 1-5
  const accurate = mentioned ? (seed % 100) < 80 : true; // 80% accuracy when mentioned

  const numCompetitors = (seed % 4); // 0-3 competitors
  const competitors: CompetitorMention[] = [];
  for (let i = 0; i < numCompetitors; i++) {
    const compIdx = (seed + i * 7) % SIMULATION_COMPETITORS.length;
    competitors.push({
      name: SIMULATION_COMPETITORS[compIdx],
      position: ((seed + i) % 5) + 1,
    });
  }

  const accuracyIssues: string[] = [];
  if (!accurate) {
    const issues = ["Incorrect business hours", "Wrong address listed", "Outdated phone number", "Missing service details"];
    accuracyIssues.push(issues[seed % issues.length]);
  }

  const summaryParts: string[] = [];
  if (mentioned) {
    summaryParts.push(`${clientName} mentioned at position ${position}.`);
    if (competitors.length > 0) {
      summaryParts.push(`Competitors mentioned: ${competitors.map(c => c.name).join(", ")}.`);
    }
    if (!accurate) {
      summaryParts.push(`Accuracy issues: ${accuracyIssues.join("; ")}.`);
    }
  } else {
    summaryParts.push(`${clientName} not mentioned in response.`);
    if (competitors.length > 0) {
      summaryParts.push(`Competitors appeared: ${competitors.map(c => c.name).join(", ")}.`);
    }
  }

  return {
    clientMentioned: mentioned,
    clientPosition: position,
    informationAccurate: accurate,
    accuracyIssues,
    competitorMentions: competitors,
    rawResponse: JSON.stringify({
      platform,
      query,
      simulated: true,
      mentioned,
      position,
      competitors: competitors.map(c => c.name),
    }),
    responseSummary: summaryParts.join(" "),
    queryMethod: "simulation",
    responseTimeMs: 200 + (seed % 800),
  };
}

/**
 * Simple deterministic hash for seeding simulation results.
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
