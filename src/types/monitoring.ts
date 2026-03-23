/**
 * Monitoring subsystem type definitions.
 */

// ── Platforms ──

export type Platform = "chatgpt" | "perplexity" | "google_aio" | "gemini" | "claude";

export const ALL_PLATFORMS: Platform[] = ["chatgpt", "perplexity", "google_aio", "gemini", "claude"];

export const PLATFORM_LABELS: Record<Platform, string> = {
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  google_aio: "Google AI Overview",
  gemini: "Gemini",
  claude: "Claude",
};

// ── Query Generation ──

export interface GeneratedQuery {
  queryText: string;
  language: string;
  sourceKeyword: string;
  sourceCpcInr: number;
  focusItemType: "service" | "product";
  focusItemId: string;
}

// ── Monitoring Results ──

export interface CompetitorMention {
  name: string;
  position: number | null;
  infoPresentd?: string;
}

export interface NormalizedResult {
  clientMentioned: boolean;
  clientPosition: number | null;
  informationAccurate: boolean;
  accuracyIssues: string[];
  competitorMentions: CompetitorMention[];
  rawResponse: string;
  responseSummary: string;
  queryMethod: string;
  responseTimeMs: number;
}

// ── Scoring ──

export type PlatformScores = Partial<Record<Platform, number>>;

export interface ItemScore {
  itemId: string;
  itemName: string;
  itemType: "service" | "product";
  score: number;
  platforms: PlatformScores;
}

export interface CompetitorData {
  name: string;
  totalMentions: number;
  avgPosition: number;
  platformBreakdown: PlatformScores;
}

// ── Dashboard Response Types ──

export interface DashboardOverview {
  visibilityScore: number;
  queriesMonitored: number;
  aiSearchValueInr: number;
  competitorsTracked: number;
  platformBreakdown: PlatformScores;
  trendData: Array<{
    date: string;
    score: number;
    platforms: PlatformScores;
  }>;
  competitors: CompetitorData[];
}

export interface DashboardCompetitors {
  competitors: CompetitorData[];
}

export interface DashboardItems {
  items: ItemScore[];
}
