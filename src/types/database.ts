import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type {
  agencies,
  users,
  clients,
  dataSources,
  knowledgeGraphs,
  knowledgeGraphHistory,
  presenceDeployments,
  monitoringQueries,
  monitoringResults,
  visibilityScores,
  recommendations,
  systemHealthLogs,
  apiUsageLogs,
  experiments,
  metaIntelligenceRuns,
} from "@/lib/db/schema";

// ── Select types (reading from DB) ──

export type Agency = InferSelectModel<typeof agencies>;
export type User = InferSelectModel<typeof users>;
export type Client = InferSelectModel<typeof clients>;
export type DataSource = InferSelectModel<typeof dataSources>;
export type KnowledgeGraph = InferSelectModel<typeof knowledgeGraphs>;
export type KnowledgeGraphHistoryEntry = InferSelectModel<typeof knowledgeGraphHistory>;
export type PresenceDeployment = InferSelectModel<typeof presenceDeployments>;
export type MonitoringQuery = InferSelectModel<typeof monitoringQueries>;
export type MonitoringResult = InferSelectModel<typeof monitoringResults>;
export type VisibilityScore = InferSelectModel<typeof visibilityScores>;
export type Recommendation = InferSelectModel<typeof recommendations>;
export type SystemHealthLog = InferSelectModel<typeof systemHealthLogs>;
export type ApiUsageLog = InferSelectModel<typeof apiUsageLogs>;
export type Experiment = InferSelectModel<typeof experiments>;
export type MetaIntelligenceRun = InferSelectModel<typeof metaIntelligenceRuns>;

// ── Insert types (writing to DB) ──

export type NewAgency = InferInsertModel<typeof agencies>;
export type NewUser = InferInsertModel<typeof users>;
export type NewClient = InferInsertModel<typeof clients>;
export type NewDataSource = InferInsertModel<typeof dataSources>;
export type NewKnowledgeGraph = InferInsertModel<typeof knowledgeGraphs>;
export type NewPresenceDeployment = InferInsertModel<typeof presenceDeployments>;
export type NewMonitoringQuery = InferInsertModel<typeof monitoringQueries>;
export type NewMonitoringResult = InferInsertModel<typeof monitoringResults>;
export type NewRecommendation = InferInsertModel<typeof recommendations>;
export type NewApiUsageLog = InferInsertModel<typeof apiUsageLogs>;

// ── User roles ──

export type UserRole = "super_admin" | "agency_admin" | "agency_member" | "client";

// ── Data source status flow ──

export type DataSourceStatus =
  | "pending"
  | "connected"
  | "syncing"
  | "active"
  | "error"
  | "disconnected";

// ── Data source types ──

export type DataSourceType =
  | "google_ads"
  | "gbp"
  | "search_console"
  | "analytics"
  | "merchant_center"
  | "shopify"
  | "woocommerce"
  | "facebook"
  | "instagram"
  | "website_crawl";
