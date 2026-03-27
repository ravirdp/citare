// ══════════════════════════════════════
// CITABILITY SCORING TYPES
// ══════════════════════════════════════

export interface ContentBlock {
  heading: string;
  content: string;
  wordCount: number;
}

export interface BlockBreakdown {
  answerBlockQuality: number; // max 30
  selfContainment: number; // max 25
  structuralReadability: number; // max 20
  statisticalDensity: number; // max 15
  uniquenessSignals: number; // max 10
}

export type CitabilityGrade = "A" | "B" | "C" | "D" | "F";

export interface BlockAnalysis {
  heading: string;
  wordCount: number;
  totalScore: number;
  grade: CitabilityGrade;
  label: string;
  breakdown: BlockBreakdown;
  preview: string;
  suggestions: string[];
}

export interface CitabilityScore {
  totalBlocksAnalyzed: number;
  averageScore: number;
  optimalLengthPassages: number;
  gradeDistribution: Record<CitabilityGrade, number>;
  topBlocks: BlockAnalysis[];
  bottomBlocks: BlockAnalysis[];
  allBlocks: BlockAnalysis[];
}

// ══════════════════════════════════════
// CRAWLER ACCESS TYPES
// ══════════════════════════════════════

export type CrawlerAccessStatus =
  | "allowed"
  | "blocked"
  | "not_mentioned"
  | "conditionally_allowed";

export type CrawlerSeverity = "critical" | "warning" | "info";

export interface CrawlerResult {
  name: string;
  userAgent: string;
  status: CrawlerAccessStatus;
  severity: CrawlerSeverity;
  rule?: string; // the matching rule from robots.txt
}

export interface CrawlerAccessReport {
  domain: string;
  robotsTxtFound: boolean;
  robotsTxtUrl: string;
  crawlers: CrawlerResult[];
  overallStatus: "all_allowed" | "some_blocked" | "critical_blocked";
  recommendations: string[];
  criticalCount: number;
  blockedCount: number;
}

// ══════════════════════════════════════
// BRAND MENTION TYPES
// ══════════════════════════════════════

export interface PlatformMention {
  platform: string;
  weight: number; // percentage weight for scoring
  correlation: string; // correlation strength description
  mentionCount: number;
  sentiment: "positive" | "negative" | "neutral" | "unknown";
  recency: "recent" | "stale" | "none"; // within 6 months, older, or none
  searchUrl: string;
  recommendations: string[];
}

export interface BrandAuthorityScore {
  brandName: string;
  domain?: string;
  overallScore: number; // 0-100
  platformBreakdown: PlatformMention[];
  competitorComparison?: Array<{
    name: string;
    score: number;
  }>;
  topRecommendations: string[];
}

// ══════════════════════════════════════
// AUDIT TYPES
// ══════════════════════════════════════

export interface SchemaOrgDetection {
  hasJsonLd: boolean;
  hasMicrodata: boolean;
  hasRdfa: boolean;
  schemas: string[]; // e.g. ["LocalBusiness", "Product", "FAQPage"]
  completenessScore: number; // 0-100
  recommendations: string[];
}

export interface AuditActionItem {
  category: "citability" | "crawler_access" | "brand_authority" | "schema" | "content_structure";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
}

export interface GeoScore {
  overall: number; // 0-100
  breakdown: {
    citability: number; // 25% weight
    crawlerAccess: number; // 15% weight
    brandAuthority: number; // 20% weight
    schemaCompleteness: number; // 15% weight
    contentStructure: number; // 25% weight
  };
}

export interface AuditReport {
  id: string;
  url: string;
  businessName: string;
  geoScore: GeoScore;
  citability: CitabilityScore;
  crawlerAccess: CrawlerAccessReport;
  brandAuthority: BrandAuthorityScore;
  schemaDetection: SchemaOrgDetection;
  actionItems: AuditActionItem[];
  createdAt: string;
}
