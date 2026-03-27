import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  integer,
  boolean,
  decimal,
  date,
  unique,
  index,
} from "drizzle-orm/pg-core";

// ══════════════════════════════════════
// IDENTITY & ACCESS
// ══════════════════════════════════════

export const agencies = pgTable("agencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  branding: jsonb("branding").default({}),
  subscriptionTier: text("subscription_tier").default("free"),
  billing: jsonb("billing").default({}),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  name: text("name"),
  role: text("role").notNull(), // super_admin, agency_admin, agency_member, client
  agencyId: uuid("agency_id").references(() => agencies.id),
  clientId: uuid("client_id").references(() => clients.id),
  authProviderId: text("auth_provider_id"),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

// ══════════════════════════════════════
// CLIENT & DATA SOURCES
// ══════════════════════════════════════

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agencyId: uuid("agency_id").references(() => agencies.id),
    name: text("name").notNull(),
    slug: text("slug").unique().notNull(),
    businessType: text("business_type").notNull(), // physical, ecommerce, hybrid
    status: text("status").default("onboarding"), // onboarding, active, paused, churned
    landmarkDescription: text("landmark_description"),
    languages: text("languages").array().default(["en"]),
    subscriptionTier: text("subscription_tier").default("physical"),
    monthlyFeeInr: integer("monthly_fee_inr"),
    settings: jsonb("settings").default({}),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_clients_agency").on(table.agencyId),
    index("idx_clients_status").on(table.status),
  ]
);

export const dataSources = pgTable(
  "data_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    sourceType: text("source_type").notNull(),
    status: text("status").default("pending"),
    credentials: jsonb("credentials").default({}),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    nextSyncAt: timestamp("next_sync_at", { withTimezone: true }),
    syncFrequencyHours: integer("sync_frequency_hours").default(6),
    rawData: jsonb("raw_data").default({}),
    errorLog: jsonb("error_log").default([]),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_data_sources_client").on(table.clientId),
    index("idx_data_sources_type").on(table.sourceType),
  ]
);

// ══════════════════════════════════════
// KNOWLEDGE GRAPH
// ══════════════════════════════════════

export const knowledgeGraphs = pgTable("knowledge_graphs", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .unique()
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  version: integer("version").default(1),
  businessProfile: jsonb("business_profile").notNull().default({}),
  services: jsonb("services").default([]),
  products: jsonb("products").default([]),
  competitors: jsonb("competitors").default([]),
  presenceState: jsonb("presence_state").default({}),
  searchState: jsonb("search_state").default({}),
  decisionRadiusMap: jsonb("decision_radius_map").default({}),
  confidenceScores: jsonb("confidence_scores").default({}),
  conflicts: jsonb("conflicts").default([]),
  lastStrategistRun: timestamp("last_strategist_run", { withTimezone: true }),
  lastWorkerRun: timestamp("last_worker_run", { withTimezone: true }),
  strategistCooldownUntil: timestamp("strategist_cooldown_until", {
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const knowledgeGraphHistory = pgTable("knowledge_graph_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  knowledgeGraphId: uuid("knowledge_graph_id")
    .notNull()
    .references(() => knowledgeGraphs.id),
  version: integer("version").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  changedBy: text("changed_by"),
  changeReason: text("change_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ══════════════════════════════════════
// PRESENCE LAYER
// ══════════════════════════════════════

export const presenceDeployments = pgTable("presence_deployments", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  format: text("format").notNull(),
  language: text("language").default("en"),
  deploymentMethod: text("deployment_method").notNull(),
  content: text("content"),
  contentHash: text("content_hash"),
  deploymentUrl: text("deployment_url"),
  status: text("status").default("draft"),
  healthCheck: jsonb("health_check").default({}),
  lastDeployedAt: timestamp("last_deployed_at", { withTimezone: true }),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ══════════════════════════════════════
// MONITORING & INTELLIGENCE
// ══════════════════════════════════════

export const monitoringQueries = pgTable("monitoring_queries", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  queryText: text("query_text").notNull(),
  language: text("language").default("en"),
  sourceKeyword: text("source_keyword"),
  sourceCpcInr: decimal("source_cpc_inr"),
  focusItemType: text("focus_item_type"),
  focusItemId: text("focus_item_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const monitoringResults = pgTable(
  "monitoring_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    queryId: uuid("query_id")
      .notNull()
      .references(() => monitoringQueries.id),
    platform: text("platform").notNull(),
    clientMentioned: boolean("client_mentioned").default(false),
    clientPosition: integer("client_position"),
    informationAccurate: boolean("information_accurate"),
    accuracyIssues: jsonb("accuracy_issues").default([]),
    competitorMentions: jsonb("competitor_mentions").default([]),
    rawResponse: text("raw_response"),
    responseSummary: text("response_summary"),
    queryMethod: text("query_method"),
    responseTimeMs: integer("response_time_ms"),
    queriedAt: timestamp("queried_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_monitoring_results_client_date").on(
      table.clientId,
      table.queriedAt
    ),
    index("idx_monitoring_results_platform").on(table.platform),
  ]
);

export const visibilityScores = pgTable(
  "visibility_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    overallScore: decimal("overall_score"),
    platformScores: jsonb("platform_scores").default({}),
    itemScores: jsonb("item_scores").default({}),
    gadsEquivalentValueInr: decimal("gads_equivalent_value_inr"),
    brandedSearchTrend: jsonb("branded_search_trend").default({}),
    gbpActionsTrend: jsonb("gbp_actions_trend").default({}),
    competitorComparison: jsonb("competitor_comparison").default({}),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique("visibility_scores_client_date").on(table.clientId, table.date),
    index("idx_visibility_scores_client_date").on(table.clientId, table.date),
  ]
);

// ══════════════════════════════════════
// RECOMMENDATIONS & ACTIONS
// ══════════════════════════════════════

export const recommendations = pgTable(
  "recommendations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    generatedBy: text("generated_by").notNull(),
    type: text("type").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    priority: text("priority").default("medium"),
    status: text("status").default("pending"),
    actionData: jsonb("action_data").default({}),
    resultData: jsonb("result_data").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    actedOnAt: timestamp("acted_on_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_recommendations_client").on(table.clientId, table.status),
  ]
);

// ══════════════════════════════════════
// SYSTEM OPERATIONS
// ══════════════════════════════════════

export const systemHealthLogs = pgTable(
  "system_health_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    service: text("service").notNull(),
    status: text("status").notNull(),
    responseTimeMs: integer("response_time_ms"),
    errorMessage: text("error_message"),
    metadata: jsonb("metadata").default({}),
    checkedAt: timestamp("checked_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_system_health").on(table.service, table.checkedAt),
  ]
);

export const apiUsageLogs = pgTable(
  "api_usage_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id").references(() => clients.id),
    tier: text("tier").notNull(),
    provider: text("provider").notNull(),
    model: text("model"),
    tokensIn: integer("tokens_in"),
    tokensOut: integer("tokens_out"),
    costInr: decimal("cost_inr"),
    durationMs: integer("duration_ms"),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_api_usage_client").on(table.clientId, table.createdAt),
    index("idx_api_usage_tier").on(table.tier, table.createdAt),
  ]
);

export const experiments = pgTable("experiments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("draft"),
  experimentType: text("experiment_type").notNull(),
  config: jsonb("config").notNull().default({}),
  results: jsonb("results").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const metaIntelligenceRuns = pgTable("meta_intelligence_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  runType: text("run_type").notNull(),
  inputSummary: jsonb("input_summary").default({}),
  findings: jsonb("findings").default({}),
  actionsTaken: jsonb("actions_taken").default([]),
  roadmapSuggestions: jsonb("roadmap_suggestions").default([]),
  modelUsed: text("model_used"),
  tokensUsed: integer("tokens_used"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ══════════════════════════════════════
// FREE AUDIT
// ══════════════════════════════════════

export const contactSubmissions = pgTable(
  "contact_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    message: text("message").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_contact_submissions_created").on(table.createdAt),
  ]
);

export const audits = pgTable(
  "audits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    url: text("url").notNull(),
    businessName: text("business_name").notNull(),
    results: jsonb("results").default({}),
    geoScore: decimal("geo_score"),
    status: text("status").default("pending"), // pending, running, completed, failed
    contactName: text("contact_name"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    contactCity: text("contact_city"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_audits_created").on(table.createdAt),
  ]
);
