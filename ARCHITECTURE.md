# CITARE — Technical Architecture & Build Specification
## Version 1.0 — March 2026

> **Purpose**: This document translates the Citare Product Bible into exact technical specifications. Every section maps to buildable code. This is the reference Claude Code reads before writing any module.

> **Design Principle**: All architectures are extensible. New data sources, new AI platforms, new output formats, and new insight types can be added without restructuring existing systems. Every interface is designed for "one more thing."

---

## 1. Infrastructure & Service Stack

### 1.1 Chosen Services (Free Tier First, Paid When Revenue Justifies)

| Service | Role | Free Tier Limits | Upgrade Trigger |
|---------|------|-----------------|-----------------|
| **Supabase** | PostgreSQL database, Auth, Row Level Security, Storage | 500MB DB, 1GB storage, 50K MAUs, 2 projects | >400MB DB or need for backups (~30 clients) |
| **Vercel** | Frontend hosting, Serverless API routes, Edge functions | 100GB bandwidth, 1M edge requests, 1M function invocations | Commercial use requires Pro at $20/mo (upgrade at launch) |
| **Upstash Redis** | Event queue, job queue, caching, rate limiting | 256MB data, 500K commands/month, 10 free databases | >400K commands/month (~50 clients with daily monitoring) |
| **Upstash QStash** | Scheduled jobs, cron-like triggers for Tier Zero polling | 500 messages/day on free tier | >400 messages/day (~30 clients) |
| **Anthropic API** | Tier One (Opus), Tier Two (Sonnet), Tier Three (Haiku) | Pay-per-use, no free tier (use Claude Max for dev/test) | Production launch |
| **OpenAI API** | ChatGPT monitoring queries (scout tier) | Pay-per-use | Production launch |
| **Perplexity API** | Perplexity monitoring queries (scout tier) | Free tier available with limits | Production launch |
| **Google APIs** | Ads, GBP, Search Console, Analytics, Merchant Center | Free with quota limits per project | Standard quota sufficient for 100+ clients |
| **SerpAPI / ScaleSerp** | Google AI Overview monitoring | ~100 free searches/month | Paid from first client (~$50/mo for 5K searches) |
| **Resend** | Transactional email (alerts, reports) | 100 emails/day free | >100 emails/day |
| **Vercel Blob / Supabase Storage** | CDN for product images, generated assets | Included in Vercel/Supabase free tiers | When product showcase images exceed 1GB |

### 1.2 Development Environment

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| **Framework** | Next.js 14+ (App Router) | Full-stack: React frontend + API routes + serverless functions. Deploys to Vercel natively. |
| **Language** | TypeScript throughout | Type safety prevents the "rebuild because of wrong assumptions" problem |
| **ORM** | Drizzle ORM | Lightweight, type-safe, works well with Supabase/Postgres |
| **Styling** | Tailwind CSS + shadcn/ui | Fast UI development, consistent design system |
| **State Management** | React Query (TanStack Query) | Server state management, caching, reduces Supabase egress |
| **Package Manager** | pnpm | Faster, disk-efficient (important for 230GB disk) |
| **Monorepo** | Turborepo (optional, phase 2+) | When multi-package structure needed |

### 1.3 Developer Machine Constraints

```
CPU: Intel i5-1035G1 @ 1.00GHz (4 cores, 8 threads)
RAM: 7.53 GiB
Disk: 229.80 GiB
OS: Pop!_OS 24.04 LTS (x86_64)
Graphics: Intel Iris Plus G1 (Ice Lake)
```

**Implications:**
- No Docker containers during development (RAM constraint). Use cloud services directly.
- No local database. Supabase cloud only.
- No local Redis. Upstash cloud only.
- Keep max 2-3 dev processes running simultaneously (Next.js dev server + Claude Code + browser).
- Use `pnpm` over `npm` to save disk space.
- AI processing happens via API calls, never locally.

---

## 2. Project Structure

```
citare/
├── CLAUDE.md                    # Claude Code context file (always read first)
├── ARCHITECTURE.md              # This document
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── next.config.ts
├── drizzle.config.ts
├── .env.local                   # Local env vars (never committed)
├── .env.example                 # Template for env vars
│
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── (auth)/              # Auth-related pages
│   │   │   ├── login/
│   │   │   └── callback/        # OAuth callback handler
│   │   ├── (dashboard)/         # Client/agency dashboard
│   │   │   ├── overview/
│   │   │   ├── services/
│   │   │   ├── products/
│   │   │   ├── competitors/
│   │   │   ├── monitoring/
│   │   │   └── reports/
│   │   ├── (admin)/             # Super admin console
│   │   │   ├── health/
│   │   │   ├── clients/
│   │   │   ├── costs/
│   │   │   ├── experiments/
│   │   │   └── meta/            # Layer 4 meta-intelligence view
│   │   ├── (agency)/            # Agency management
│   │   │   ├── clients/
│   │   │   ├── billing/
│   │   │   └── settings/
│   │   ├── api/                 # API routes
│   │   │   ├── auth/
│   │   │   ├── ingest/          # Data ingestion endpoints
│   │   │   ├── presence/        # Presence layer endpoints
│   │   │   ├── monitor/         # Monitoring endpoints
│   │   │   ├── webhook/         # External webhook handlers
│   │   │   ├── cron/            # Scheduled job triggers
│   │   │   └── admin/           # Admin API
│   │   └── layout.tsx
│   │
│   ├── lib/                     # Shared libraries
│   │   ├── db/                  # Database
│   │   │   ├── schema.ts        # Drizzle schema (ALL tables)
│   │   │   ├── client.ts        # Supabase/Drizzle client
│   │   │   └── migrations/      # Migration files
│   │   ├── ai/                  # AI Provider abstraction
│   │   │   ├── provider.ts      # Interface definition
│   │   │   ├── production.ts    # Real API calls
│   │   │   ├── simulation.ts    # Dev/test mode (manual via Claude Max)
│   │   │   └── prompts/         # All AI prompts organized by tier
│   │   │       ├── strategist/  # Tier One prompts
│   │   │       ├── worker/      # Tier Two prompts
│   │   │       └── scout/       # Tier Three prompts
│   │   ├── integrations/        # External API integrations
│   │   │   ├── google/          # All Google APIs
│   │   │   │   ├── ads.ts
│   │   │   │   ├── gbp.ts
│   │   │   │   ├── search-console.ts
│   │   │   │   ├── analytics.ts
│   │   │   │   ├── merchant.ts
│   │   │   │   └── oauth.ts     # Shared OAuth flow
│   │   │   ├── shopify/
│   │   │   ├── woocommerce/
│   │   │   ├── social/          # Facebook/Instagram
│   │   │   └── _template.ts     # Template for adding new integrations
│   │   ├── knowledge-graph/     # Knowledge graph operations
│   │   │   ├── types.ts         # KG data types
│   │   │   ├── builder.ts       # Build/update KG from raw data
│   │   │   ├── queries.ts       # Read operations
│   │   │   └── events.ts        # KG change event emitters
│   │   ├── presence/            # Presence layer generation
│   │   │   ├── json-ld.ts       # Schema.org JSON-LD generator
│   │   │   ├── llms-txt.ts      # llms.txt generator
│   │   │   ├── faq.ts           # FAQ page generator
│   │   │   ├── markdown.ts      # Structured markdown generator
│   │   │   ├── product-feed.ts  # Product/service feed generator
│   │   │   └── _template.ts     # Template for adding new formats
│   │   ├── monitoring/          # Scout & monitoring logic
│   │   │   ├── platforms/       # Per-platform query adapters
│   │   │   │   ├── chatgpt.ts
│   │   │   │   ├── perplexity.ts
│   │   │   │   ├── gemini.ts
│   │   │   │   ├── claude.ts
│   │   │   │   ├── google-aio.ts
│   │   │   │   └── _template.ts # Template for adding new platforms
│   │   │   ├── query-builder.ts # Generate queries from KG
│   │   │   └── result-parser.ts # Normalize results across platforms
│   │   ├── queue/               # Job queue (Upstash Redis/QStash)
│   │   │   ├── client.ts        # Queue connection
│   │   │   ├── events.ts        # Event type definitions
│   │   │   └── handlers/        # Event handlers by type
│   │   ├── scoring/             # Visibility scoring & attribution
│   │   │   ├── visibility.ts    # AI Search Impact Score
│   │   │   ├── attribution.ts   # Four-signal attribution model
│   │   │   └── ad-value.ts      # Equivalent ad spend calculator
│   │   └── utils/               # Shared utilities
│   │       ├── languages.ts     # Multi-language & Hinglish support
│   │       ├── landmarks.ts     # Landmark processing
│   │       ├── decision-radius.ts # Decision radius classification
│   │       └── validators.ts    # Shared validation
│   │
│   ├── components/              # React components
│   │   ├── ui/                  # shadcn/ui base components
│   │   ├── dashboard/           # Dashboard-specific components
│   │   ├── admin/               # Admin console components
│   │   └── shared/              # Shared components
│   │
│   └── types/                   # Global TypeScript types
│       ├── database.ts          # Generated from Drizzle schema
│       ├── api.ts               # API request/response types
│       ├── knowledge-graph.ts   # KG data structures
│       └── monitoring.ts        # Monitoring data types
│
├── public/                      # Static assets
│   └── presence/                # Served presence layer content
│       └── [client-slug]/       # Per-client hosted profiles
│
└── scripts/                     # Utility scripts
    ├── seed.ts                  # Seed database with test data
    ├── simulate-tier.ts         # Run AI tier in simulation mode
    └── migrate.ts               # Database migration runner
```

**Extensibility pattern**: Every directory with a `_template.ts` file is designed for additions. To add a new Google API, copy `_template.ts` and implement the interface. To add a new AI platform to monitor, copy `monitoring/platforms/_template.ts`. To add a new output format, copy `presence/_template.ts`. The architecture never needs restructuring to add new capabilities.

---

## 3. Database Schema

### 3.1 Multi-Tenancy Model

```
Agency (1) → has many → Clients (N)
Client (1) → has one → KnowledgeGraph (1)
Client (1) → has many → DataSources (N)
Client (1) → has many → PresenceDeployments (N)
Client (1) → has many → MonitoringResults (N)
Client (1) → has many → FocusItems (N) [services or products]
```

Row Level Security (RLS) enforced at database level:
- Agency users see only their agency's clients
- Client users see only their own data
- Admin users see everything
- Layer 4 queries use a service role that strips identifiers before analysis

### 3.2 Core Tables

```sql
-- ══════════════════════════════════════
-- IDENTITY & ACCESS
-- ══════════════════════════════════════

CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,           -- used in agency.citare.ai/{slug}
  branding JSONB DEFAULT '{}',         -- logo_url, colors, custom domain
  subscription_tier TEXT DEFAULT 'free', -- free, active, enterprise
  billing JSONB DEFAULT '{}',          -- stripe details, plan info
  settings JSONB DEFAULT '{}',         -- extensible settings
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL,                  -- super_admin, agency_admin, agency_member, client
  agency_id UUID REFERENCES agencies(id),
  client_id UUID REFERENCES clients(id), -- only for client-role users
  auth_provider_id TEXT,               -- Supabase Auth UID
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

-- ══════════════════════════════════════
-- CLIENT & DATA SOURCES
-- ══════════════════════════════════════

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id),  -- NULL for direct clients
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  business_type TEXT NOT NULL,            -- physical, ecommerce, hybrid
  status TEXT DEFAULT 'onboarding',       -- onboarding, active, paused, churned
  
  -- Onboarding inputs (manual)
  landmark_description TEXT,              -- "near Jehangir Hospital, opposite Phoenix Mall"
  languages TEXT[] DEFAULT '{en}',        -- {en, hi, hinglish, mr, ta, ...}
  
  -- Subscription
  subscription_tier TEXT DEFAULT 'physical', -- physical, ecommerce, multi_location
  monthly_fee_inr INTEGER,
  
  -- Metadata (extensible)
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',            -- anything else we discover we need
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,              -- google_ads, gbp, search_console, analytics,
                                          -- merchant_center, shopify, woocommerce, 
                                          -- facebook, instagram, website_crawl
                                          -- (extensible: add any new source type as a string)
  status TEXT DEFAULT 'pending',          -- pending, connected, syncing, active, error, disconnected
  credentials JSONB DEFAULT '{}',         -- encrypted OAuth tokens, API keys
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  sync_frequency_hours INTEGER DEFAULT 6,
  raw_data JSONB DEFAULT '{}',            -- latest raw pull (overwritten each sync)
  error_log JSONB DEFAULT '[]',           -- recent errors
  metadata JSONB DEFAULT '{}',            -- source-specific config
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════
-- KNOWLEDGE GRAPH
-- ══════════════════════════════════════

CREATE TABLE knowledge_graphs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID UNIQUE NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1,
  
  -- Business State
  business_profile JSONB NOT NULL DEFAULT '{}',
  -- Structure: {
  --   name, description, categories[], 
  --   contact: { phone, email, website },
  --   address: { street, city, state, pin, coordinates: {lat, lng} },
  --   landmarks: { client_described: "", auto_detected: [], google_nearby: [] },
  --   hours: { regular: {}, special: [] },
  --   attributes: [],
  --   languages: [],
  --   voice_profile: ""  -- how the business communicates
  -- }
  
  services JSONB DEFAULT '[]',
  -- Array of: {
  --   id, name, description, category, 
  --   decision_radius: "planned" | "considered" | "impulse",
  --   prominence_score: 0-100,
  --   keywords: [], cpc_data: {}, 
  --   competitor_services: [],
  --   multi_lang: { en: {}, hi: {}, hinglish: {}, regional: {} }
  -- }
  
  products JSONB DEFAULT '[]',
  -- Array of: {
  --   id, name, description, category, subcategory,
  --   focus_type: "top10" | "aspirational" | "defensive" | "seasonal",
  --   price: { amount, currency, sale_price },
  --   specifications: {},
  --   images: [], brand, gtin, sku,
  --   review_sentiment: {}, aggregate_rating: {},
  --   use_cases: [], target_audience: "",
  --   keywords: [], cpc_data: {},
  --   competitor_products: [],
  --   multi_lang: { en: {}, hi: {}, hinglish: {}, regional: {} }
  -- }
  
  competitors JSONB DEFAULT '[]',
  -- Array of: { name, source, services/products, strengths, weaknesses }
  
  -- Presence State
  presence_state JSONB DEFAULT '{}',
  -- { formats_deployed: [], deployment_method, last_generated, health_status }
  
  -- Search State
  search_state JSONB DEFAULT '{}',
  -- { visibility_scores: {}, platform_appearances: {}, accuracy_flags: [] }
  
  -- Decision Radius Classifications
  decision_radius_map JSONB DEFAULT '{}',
  -- { service_id: "planned" | "considered" | "impulse" }
  
  -- Confidence & Conflicts
  confidence_scores JSONB DEFAULT '{}',
  conflicts JSONB DEFAULT '[]',
  
  -- AI Processing Metadata
  last_strategist_run TIMESTAMPTZ,
  last_worker_run TIMESTAMPTZ,
  strategist_cooldown_until TIMESTAMPTZ,  -- Feedback loop dampening
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Previous versions for rollback (30-day retention)
CREATE TABLE knowledge_graph_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_graph_id UUID NOT NULL REFERENCES knowledge_graphs(id),
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL,              -- full KG state at that version
  changed_by TEXT,                      -- tier_one, tier_two, manual
  change_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════
-- PRESENCE LAYER
-- ══════════════════════════════════════

CREATE TABLE presence_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  format TEXT NOT NULL,                 -- json_ld, llms_txt, faq_page, markdown_page,
                                        -- product_feed, product_showcase
                                        -- (extensible: add new formats as strings)
  language TEXT DEFAULT 'en',           -- en, hi, hinglish, mr, ta, etc.
  deployment_method TEXT NOT NULL,      -- script_injection, dns_subdomain, hosted_profile
  content TEXT,                         -- generated content (the actual output)
  content_hash TEXT,                    -- for change detection
  deployment_url TEXT,                  -- where it's accessible
  status TEXT DEFAULT 'draft',          -- draft, deployed, error, offline
  health_check JSONB DEFAULT '{}',     -- last validation result
  last_deployed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════
-- MONITORING & INTELLIGENCE
-- ══════════════════════════════════════

CREATE TABLE monitoring_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  source_keyword TEXT,                  -- the Google Ads keyword this derives from
  source_cpc_inr DECIMAL,              -- CPC for ad spend value calculation
  focus_item_type TEXT,                 -- service, product
  focus_item_id TEXT,                   -- reference to service/product in KG
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE monitoring_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  query_id UUID NOT NULL REFERENCES monitoring_queries(id),
  platform TEXT NOT NULL,               -- chatgpt, perplexity, google_aio, gemini, claude
                                        -- (extensible: add new platforms as strings)
  
  -- Result data
  client_mentioned BOOLEAN DEFAULT false,
  client_position INTEGER,              -- rank position if mentioned (1 = first)
  information_accurate BOOLEAN,
  accuracy_issues JSONB DEFAULT '[]',   -- list of inaccuracies found
  competitor_mentions JSONB DEFAULT '[]', -- [{name, position, info_presented}]
  
  -- Raw data
  raw_response TEXT,                    -- full AI platform response
  response_summary TEXT,                -- Tier Two processed summary
  
  -- Metadata
  query_method TEXT,                    -- api, serp_api, headless_browser
  response_time_ms INTEGER,
  
  queried_at TIMESTAMPTZ DEFAULT now()
);

-- Daily aggregated scores (computed by Tier Two from monitoring_results)
CREATE TABLE visibility_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Overall scores
  overall_score DECIMAL,                -- 0-100 composite visibility score
  platform_scores JSONB DEFAULT '{}',   -- { chatgpt: 72, perplexity: 85, ... }
  
  -- Per-service/product scores
  item_scores JSONB DEFAULT '{}',       -- { service_id: { score, platforms: {} } }
  
  -- Attribution signals
  gads_equivalent_value_inr DECIMAL,    -- equivalent Google Ads spend
  branded_search_trend JSONB DEFAULT '{}',
  gbp_actions_trend JSONB DEFAULT '{}',
  
  -- Competitive position
  competitor_comparison JSONB DEFAULT '{}',
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(client_id, date)
);

-- ══════════════════════════════════════
-- RECOMMENDATIONS & ACTIONS
-- ══════════════════════════════════════

CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  generated_by TEXT NOT NULL,           -- tier_one, tier_two, meta_intelligence
  type TEXT NOT NULL,                   -- content_update, gap_alert, competitive_alert,
                                        -- accuracy_fix, spend_optimization
                                        -- (extensible)
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',       -- low, medium, high, critical
  status TEXT DEFAULT 'pending',        -- pending, approved, rejected, auto_applied
  action_data JSONB DEFAULT '{}',       -- structured data for auto-execution
  result_data JSONB DEFAULT '{}',       -- outcome after execution
  created_at TIMESTAMPTZ DEFAULT now(),
  acted_on_at TIMESTAMPTZ
);

-- ══════════════════════════════════════
-- SYSTEM OPERATIONS (SUPER ADMIN)
-- ══════════════════════════════════════

CREATE TABLE system_health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL,                -- google_ads_api, supabase, openai_api, etc.
  status TEXT NOT NULL,                 -- green, yellow, red
  response_time_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  checked_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  tier TEXT NOT NULL,                   -- tier_zero, tier_one, tier_two, tier_three
  provider TEXT NOT NULL,               -- anthropic, openai, perplexity, serp_api, google
  model TEXT,                           -- opus, sonnet, haiku, gpt-4o, etc.
  tokens_in INTEGER,
  tokens_out INTEGER,
  cost_inr DECIMAL,
  duration_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',          -- draft, active, completed, cancelled
  experiment_type TEXT NOT NULL,        -- prompt_variant, format_variant, platform_test
  config JSONB NOT NULL DEFAULT '{}',   -- variant definitions, targeting rules
  results JSONB DEFAULT '{}',           -- outcome data
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE meta_intelligence_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type TEXT NOT NULL,               -- weekly_analysis, platform_shift, cost_optimization
  input_summary JSONB DEFAULT '{}',     -- what data was analyzed
  findings JSONB DEFAULT '{}',          -- structured findings
  actions_taken JSONB DEFAULT '[]',     -- what was auto-updated
  roadmap_suggestions JSONB DEFAULT '[]', -- manual review items
  model_used TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════

CREATE INDEX idx_clients_agency ON clients(agency_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_data_sources_client ON data_sources(client_id);
CREATE INDEX idx_data_sources_type ON data_sources(source_type);
CREATE INDEX idx_monitoring_results_client_date ON monitoring_results(client_id, queried_at);
CREATE INDEX idx_monitoring_results_platform ON monitoring_results(platform);
CREATE INDEX idx_visibility_scores_client_date ON visibility_scores(client_id, date);
CREATE INDEX idx_api_usage_client ON api_usage_logs(client_id, created_at);
CREATE INDEX idx_api_usage_tier ON api_usage_logs(tier, created_at);
CREATE INDEX idx_system_health ON system_health_logs(service, checked_at);
CREATE INDEX idx_recommendations_client ON recommendations(client_id, status);
```

### 3.3 Extensibility Notes

- **JSONB columns** are used for semi-structured data that evolves over time. Adding a new field to the knowledge graph doesn't require a migration — just update the TypeScript types and the code.
- **New data sources**: Add a new `source_type` string. No schema change needed.
- **New AI platforms**: Add a new `platform` string in monitoring_results. No schema change needed.
- **New output formats**: Add a new `format` string in presence_deployments. No schema change needed.
- **New recommendation types**: Add a new `type` string. No schema change needed.
- When a JSONB structure becomes complex enough to warrant its own table, extract it in a migration without breaking the existing interface.

---

## 4. Event System Architecture

### 4.1 Event Flow (Upstash Redis Streams)

```
Event Types (extensible — add new events as the system grows):

TIER_ZERO EVENTS (code-based polling, no AI):
  data_source.synced           → { client_id, source_type, changes_detected: boolean }
  data_source.changed          → { client_id, source_type, change_type, change_data }
  data_source.error            → { client_id, source_type, error }
  webhook.received             → { client_id, source_type, payload }

KNOWLEDGE GRAPH EVENTS:
  kg.updated                   → { client_id, changed_sections[], change_source }
  kg.conflict_detected         → { client_id, field, sources[], values[] }

PRESENCE EVENTS:
  presence.generated           → { client_id, format, language }
  presence.deployed            → { client_id, format, url }
  presence.health_check_failed → { client_id, format, error }

MONITORING EVENTS:
  monitoring.queries_queued    → { client_id, query_count }
  monitoring.result_received   → { client_id, query_id, platform }
  monitoring.batch_complete    → { client_id, date }
  monitoring.anomaly_detected  → { client_id, anomaly_type, details }

TIER ESCALATION EVENTS:
  escalation.to_tier_one       → { client_id, reason, data }
  escalation.to_tier_two       → { client_id, reason, data }

SYSTEM EVENTS:
  system.health_changed        → { service, old_status, new_status }
  system.tier_limit_warning    → { service, usage_percent }
  system.failover_triggered    → { service, from_method, to_method }

CLIENT LIFECYCLE EVENTS:
  client.onboarding_complete   → { client_id }
  client.data_stale            → { client_id, reason }
  client.churn_risk            → { client_id, signals }
```

### 4.2 Event Processing Pipeline

```
                    ┌─────────────────┐
                    │  External APIs   │
                    │  & Webhooks      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Tier Zero     │
                    │  (Code, No AI)  │
                    │  Cron + Webhooks│
                    └────────┬────────┘
                             │ emits events
                    ┌────────▼────────┐
                    │  Redis Streams  │
                    │  (Event Queue)  │
                    └────────┬────────┘
                             │ consumed by
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼──────┐ ┌────▼─────┐ ┌──────▼───────┐
     │  Tier Two     │ │  Tier    │ │  Tier One    │
     │  (Worker)     │ │  Three   │ │  (Strategist)│
     │  Daily Ops    │ │  (Scout) │ │  Weekly/Trig │
     └────────┬──────┘ └────┬─────┘ └──────┬───────┘
              │              │              │
              └──────────────┼──────────────┘
                             │ all write back to
                    ┌────────▼────────┐
                    │ Knowledge Graph │
                    │   (Supabase)    │
                    └─────────────────┘
```

### 4.3 Cron Schedule (via Upstash QStash or Vercel Cron)

| Job | Frequency | Tier | Description |
|-----|-----------|------|-------------|
| `poll-google-ads` | Every 6 hours | Zero | Check for campaign/keyword changes |
| `poll-gbp` | Every 12 hours | Zero | Check for profile, review, post changes |
| `poll-analytics` | Daily | Zero | Pull latest traffic data |
| `poll-search-console` | Daily | Zero | Pull organic search data |
| `poll-merchant-center` | Every 6 hours | Zero | Check product feed changes |
| `poll-shopify-inventory` | Via webhook (real-time) | Zero | Inventory/price changes |
| `run-scout-queries` | Daily (2am IST) | Three | Run monitoring queries for all clients |
| `process-scout-results` | Daily (6am IST) | Two | Categorize & aggregate yesterday's results |
| `compute-visibility-scores` | Daily (7am IST) | Two | Calculate daily scores from results |
| `check-presence-health` | Daily | Two | Validate all deployed structured data |
| `run-strategist-weekly` | Weekly (Monday 3am) | One | Weekly optimization pass for all clients |
| `run-strategist-monthly` | Monthly (1st, 3am) | One | Monthly insight reports |
| `run-meta-intelligence` | Weekly (Sunday 3am) | One/Meta | Cross-client Layer 4 analysis |
| `check-system-health` | Every 5 minutes | Zero | Monitor all external services |
| `log-api-usage` | Daily | Zero | Aggregate and cost-calculate API usage |

---

## 5. AI Provider Abstraction

### 5.1 Interface Design

```typescript
// src/lib/ai/provider.ts

interface AIProvider {
  strategist: {
    synthesizeKnowledgeGraph(rawData: RawClientData): Promise<KnowledgeGraph>;
    generatePresenceContent(kg: KnowledgeGraph, formats: string[]): Promise<PresenceContent[]>;
    generateInsightReport(kg: KnowledgeGraph, monitoringData: MonitoringData): Promise<InsightReport>;
    classifyDecisionRadius(services: Service[]): Promise<DecisionRadiusMap>;
    generateMultiLangContent(content: string, languages: string[]): Promise<MultiLangContent>;
  };
  
  worker: {
    processMonitoringResults(results: RawMonitoringResult[]): Promise<ProcessedResults>;
    evaluateContentHealth(deployments: PresenceDeployment[]): Promise<HealthReport>;
    detectAnomalies(scores: VisibilityScore[], history: VisibilityScore[]): Promise<Anomaly[]>;
    handleMinorUpdate(change: DataSourceChange): Promise<ContentUpdate | null>;
    prepareEscalation(issue: DetectedIssue): Promise<Escalation>;
  };
  
  scout: {
    queryPlatform(platform: string, query: string): Promise<RawPlatformResponse>;
    batchQuery(queries: MonitoringQuery[], platform: string): Promise<RawPlatformResponse[]>;
  };
  
  meta: {
    runCrossClientAnalysis(anonymizedData: AnonymizedDataset): Promise<MetaIntelligenceReport>;
  };
}
```

### 5.2 Simulation Mode (Development & Testing)

```typescript
// src/lib/ai/simulation.ts
// During dev: prompts are written to files, responses read from files
// You process them manually through Claude Max

class SimulationProvider implements AIProvider {
  private promptDir = './simulation/prompts';
  private responseDir = './simulation/responses';
  
  async strategist.synthesizeKnowledgeGraph(rawData: RawClientData) {
    const promptId = `kg-${Date.now()}`;
    // Write the full prompt to a file
    await writePrompt(promptId, buildStrategistPrompt(rawData));
    // Wait for response file to appear (you paste Claude Max response here)
    return await waitForResponse(promptId);
  }
  // ... same pattern for all methods
}
```

### 5.3 Model Routing Configuration

```typescript
// Configurable from Super Admin console, stored in Supabase
interface ModelRouting {
  tier_one: { provider: 'anthropic' | 'openai' | 'google'; model: string; };
  tier_two: { provider: 'anthropic' | 'openai' | 'google'; model: string; };
  tier_three: { provider: 'anthropic' | 'openai' | 'google'; model: string; };
  meta: { provider: 'anthropic' | 'openai' | 'google'; model: string; };
  
  // A/B test routing (optional)
  ab_test?: {
    tier: string;
    variant_a: { provider: string; model: string; percentage: number; };
    variant_b: { provider: string; model: string; percentage: number; };
  };
}
```

---

## 6. API Routes Map

### 6.1 Auth & Onboarding

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/google` | Initiate Google OAuth (Ads, GBP, SC, GA, MC) |
| GET | `/api/auth/google/callback` | OAuth callback handler |
| GET | `/api/auth/shopify` | Initiate Shopify OAuth |
| POST | `/api/auth/shopify/callback` | Shopify OAuth callback |
| POST | `/api/ingest/trigger` | Trigger initial data pull for a client |
| GET | `/api/ingest/status/:clientId` | Check ingestion progress |

### 6.2 Knowledge Graph

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/kg/:clientId` | Get current knowledge graph |
| PATCH | `/api/kg/:clientId` | Manual updates to KG (client/agency edits) |
| GET | `/api/kg/:clientId/history` | Version history |
| POST | `/api/kg/:clientId/rollback/:version` | Rollback to previous version |

### 6.3 Presence Layer

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/presence/:clientId/generate` | Trigger presence content generation |
| GET | `/api/presence/:clientId/deploy` | Deploy to configured method |
| GET | `/api/presence/:clientId/health` | Health check all deployments |
| GET | `/presence/:slug/json-ld` | Serve JSON-LD (public endpoint) |
| GET | `/presence/:slug/llms.txt` | Serve llms.txt (public endpoint) |
| GET | `/presence/:slug/about` | Serve structured markdown page |
| GET | `/presence/:slug/faq` | Serve FAQ page |
| GET | `/presence/:slug/products` | Serve product feed |
| GET | `/presence/:slug/product/:id` | Serve individual product showcase |

### 6.4 Monitoring

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/monitor/run/:clientId` | Trigger monitoring run for one client |
| POST | `/api/monitor/run-all` | Trigger daily monitoring batch |
| GET | `/api/monitor/results/:clientId` | Get monitoring results |
| GET | `/api/monitor/scores/:clientId` | Get visibility scores over time |

### 6.5 Dashboard Data

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard/:clientId/overview` | Business overview + AI search overlay |
| GET | `/api/dashboard/:clientId/competitors` | Competitive comparison data |
| GET | `/api/dashboard/:clientId/items` | Service/product drill-down |
| GET | `/api/dashboard/:clientId/recommendations` | Pending recommendations |
| POST | `/api/dashboard/:clientId/recommendations/:id/approve` | Approve recommendation |
| GET | `/api/dashboard/:clientId/report/:month` | Monthly report data |

### 6.6 Admin

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/health` | System health overview |
| GET | `/api/admin/usage` | Infrastructure usage & limits |
| GET | `/api/admin/costs` | Per-client cost breakdown |
| GET | `/api/admin/costs/:clientId` | Detailed cost for one client |
| GET | `/api/admin/clients` | Client lifecycle overview |
| GET/POST | `/api/admin/failover` | View/toggle failover switches |
| GET/POST | `/api/admin/model-routing` | View/update model routing |
| GET/POST | `/api/admin/experiments` | Manage experiments |
| GET | `/api/admin/meta-intelligence` | Latest meta-intelligence findings |

### 6.7 Webhooks (External → Citare)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/webhook/shopify` | Shopify product/inventory changes |
| POST | `/api/webhook/woocommerce` | WooCommerce changes |
| POST | `/api/webhook/stripe` | Payment events |

---

## 7. Build Sequence (Phased)

### Phase 1: Foundation (Week 1-2)
**Goal**: Connect Google, ingest data, build knowledge graph for one test business.

1. Project setup (Next.js, Supabase, Drizzle, TypeScript)
2. Database schema migration (core tables only: agencies, users, clients, data_sources, knowledge_graphs)
3. Google OAuth flow (Ads + GBP + Search Console + Analytics)
4. Data ingestion pipeline for each Google API
5. Tier One strategist prompt (knowledge graph synthesis)
6. AI Provider with simulation mode
7. Test: Connect one real Google Ads account → get knowledge graph

### Phase 2: Presence Layer (Week 3-4)
**Goal**: Generate all output formats, deploy to hosted profile.

1. Presence generation for all 5 formats (JSON-LD, llms.txt, FAQ, markdown, product feed)
2. Multi-language generation (English + Hindi + Hinglish)
3. Landmark integration into content
4. Decision-radius classification and content optimization
5. Hosted profile serving (public endpoints)
6. Schema validation and health checks
7. Test: Visit citare.ai/{test-business} → see complete, valid, multi-language presence

### Phase 3: Monitoring Engine (Week 5-6)
**Goal**: Daily monitoring, visibility scores, basic dashboard.

1. Platform query adapters (ChatGPT, Perplexity, Google AIO, Gemini, Claude)
2. Query generation from knowledge graph keywords
3. Scout execution pipeline (batch queries across platforms)
4. Tier Two result processing
5. Visibility score computation
6. Basic client dashboard (overview, scores, trends)
7. Event system (Redis streams, basic event flow)
8. Test: Run daily monitoring → see visibility scores trending over time

### Phase 4: Agency & Admin (Week 7-8)
**Goal**: Multi-tenant agency dashboard, super admin console.

1. Agency management (create agency, white-label subdomain, branding)
2. Client management within agency
3. MCC integration (list client accounts from manager account)
4. Agency dashboard (all clients view, per-client drill-down)
5. Super admin console (health, costs, usage, lifecycle)
6. Failover switches and model routing
7. Test: Agency creates 3 clients, manages them from one dashboard

### Phase 5: Intelligence & Attribution (Week 9-10)
**Goal**: Recommendations, attribution model, monthly reports.

1. Recommendation engine (content updates, gap alerts, competitive alerts)
2. One-click approve workflow
3. Four-signal attribution model (visibility + analytics + GBP + survey)
4. Equivalent ad spend value calculator
5. AI Search Impact Score
6. Monthly report generation (PDF/link)
7. E-commerce: Product showcase endpoints
8. Test: Agency presents monthly report to pilot client

### Phase 6: Meta-Intelligence & Polish (Week 11-12)
**Goal**: Layer 4, experiment system, production hardening.

1. Layer 4 meta-intelligence pipeline
2. Cross-client anonymization
3. Experiment management system
4. Feedback loop dampening
5. Email alerts (Resend integration)
6. Production error handling and logging
7. Performance optimization (caching, query optimization)
8. Test: System runs autonomously for 1 week with 5+ clients

---

## 8. Environment Variables

```bash
# .env.example

# ── Supabase ──
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=                          # Direct Postgres connection for Drizzle

# ── Upstash Redis ──
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# ── Upstash QStash ──
QSTASH_URL=
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=

# ── AI Providers ──
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
PERPLEXITY_API_KEY=
GOOGLE_GEMINI_API_KEY=

# ── SERP API ──
SERP_API_KEY=

# ── Google OAuth ──
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# ── Shopify ──
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=

# ── Email ──
RESEND_API_KEY=

# ── App Config ──
NEXT_PUBLIC_APP_URL=
AI_MODE=simulation                     # simulation | production
ADMIN_SECRET=                          # Super admin access key
```

---

## 9. Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| JSONB over normalized tables for KG | JSONB | Knowledge graph structure evolves rapidly during early product development. Normalizing prematurely locks you into a schema that will need restructuring. Extract to tables when patterns stabilize. |
| Upstash over self-hosted Redis | Upstash | Zero infrastructure management. Free tier covers dev/early production. HTTP-based works in serverless. |
| Drizzle over Prisma | Drizzle | Lighter weight, faster, better raw SQL access, smaller bundle size — all matter on a 8GB RAM dev machine. |
| Single Next.js app over microservices | Monolith | At this scale (0-750 clients), a monolith is simpler, faster to develop, and cheaper to run. Split into services only when a specific component needs independent scaling. |
| Simulation mode for AI | Custom | Claude Max is free and available. Using it during dev saves API costs and lets you iterate on prompts interactively. Switch to production mode with one env var change. |
| Redis Streams over Kafka | Upstash Redis | Kafka is overkill at this scale. Redis Streams handles the event volume easily and the free tier covers it. Migrate to Kafka only if event volume exceeds Redis capacity. |

---

*This document is a living reference. As the product evolves, update this document FIRST, then update the code. The architecture document is the source of truth.*

— End of Document —
