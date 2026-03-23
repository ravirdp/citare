# CLAUDE.md — Citare Project Context

> **Read this first.** This file provides full context for the Citare project. Read ARCHITECTURE.md for detailed technical specifications.

## What Is Citare?

Citare is an AI Search Intelligence Platform that makes businesses visible and accurately represented across AI search platforms (ChatGPT, Perplexity, Google AI Overviews, Gemini, Claude). It works by ingesting business data from Google Ads and other APIs, synthesizing it into a knowledge graph, generating structured data in multiple formats, deploying it for AI discovery, and continuously monitoring how the business appears across AI platforms.

**It is NOT an SEO tool. It optimizes for how AI models consume and recommend information.**

## Architecture Summary

Three layers sharing a central knowledge graph, connected by an event system:
- **Layer 1 (Intelligence)**: Ingest data from Google Ads, GBP, Analytics, etc. → build knowledge graph
- **Layer 2 (Presence)**: Knowledge graph → JSON-LD, llms.txt, FAQ, markdown, product feeds → deploy
- **Layer 3 (Monitoring)**: Query AI platforms daily → track visibility, accuracy, competitors → feed insights back

Four AI tiers:
- **Tier Zero**: Code-based polling, no AI (cron jobs checking APIs for changes)
- **Tier One (Opus)**: Strategic thinking — knowledge graph synthesis, content strategy, monthly insights
- **Tier Two (Sonnet)**: Daily operations — process monitoring results, handle minor updates, health checks
- **Tier Three (Haiku)**: Lightweight scouts — query AI platforms, collect raw results, zero analysis

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router), TypeScript |
| Database | Supabase (PostgreSQL + Auth + RLS + Storage) |
| ORM | Drizzle ORM |
| Queue/Cache | Upstash Redis + QStash |
| Frontend | Tailwind CSS + shadcn/ui + React Query |
| Hosting | Vercel |
| AI | Anthropic (Claude), OpenAI, Perplexity, Google Gemini APIs |
| Email | Resend |
| Package Manager | pnpm |

## Developer Machine

```
Dell Inc. 04N9HV — i5-1035G1, 7.53 GiB RAM, 230 GiB disk, Pop!_OS 24.04
```

**Constraints**: No Docker, no local DB, no local Redis. Everything cloud. Max 2-3 dev processes simultaneously. Use pnpm, not npm. All AI processing via API, never local.

## AI Mode

The project has two modes controlled by `AI_MODE` env var:
- `simulation`: Prompts written to files, responses read from files. Developer processes them via Claude Max.
- `production`: Real API calls to Anthropic, OpenAI, etc.

**During development, always use simulation mode.**

## Key Files

- `ARCHITECTURE.md` — Complete technical spec (database schema, API routes, event system, everything)
- `src/lib/db/schema.ts` — Drizzle database schema (source of truth for all tables)
- `src/lib/ai/provider.ts` — AI provider interface (strategist, worker, scout, meta)
- `src/lib/ai/prompts/` — All AI prompts organized by tier
- `src/lib/integrations/` — External API integrations (Google, Shopify, etc.)
- `src/lib/knowledge-graph/` — Knowledge graph operations
- `src/lib/presence/` — Output format generators
- `src/lib/monitoring/` — Platform monitoring adapters
- `src/lib/queue/` — Event system (Redis streams)

## Coding Conventions

- TypeScript strict mode, no `any` types unless absolutely necessary
- All database operations through Drizzle ORM, never raw SQL in application code
- All external API calls wrapped in try/catch with proper error handling
- All AI calls go through the AIProvider interface (never call APIs directly)
- Use JSONB for evolving data structures, extract to tables when patterns stabilize
- Every new integration follows the `_template.ts` pattern in its directory
- Event-driven: changes emit events, subscribers react. No tight coupling between layers.
- Functions are small and single-purpose. If a function exceeds 50 lines, split it.
- All costs logged in api_usage_logs for every AI and external API call

## Multi-Tenancy Model

```
Agency → has many → Clients → has one → Knowledge Graph
                            → has many → Data Sources
                            → has many → Presence Deployments  
                            → has many → Monitoring Results
```

Row Level Security (RLS) at database level. Agency users only see their clients. Client users only see their own data. Admin sees everything.

## Important Business Context

- Target: Indian businesses spending ₹10K+/month on Google Ads
- Primary channel: White-label through agencies (agency.citare.ai)
- Secondary: Direct self-serve
- Supports: English, Hindi, Hinglish, regional Indian languages
- Location intelligence: Landmark-based (Indian addressing style)
- Decision radius: Planned (city-wide) → Considered (local) → Impulse (proximity)
- Revenue model: Agency base fee + per-client volume pricing. No setup fees.

## Phase 0 — Complete (2026-03-22)

Project scaffolding and foundation. All verified working.

- **Git**: Initialized, pushed to `github.com/ravirdp/citare` (main branch)
- **Next.js 16** + TypeScript strict + App Router + Tailwind CSS 4 + pnpm
- **Database**: Drizzle schema with 15 tables, initial migration generated (`0000_boring_firebrand.sql`). Not yet pushed to Supabase.
- **Design system**: Full Citare aesthetic (AESTHETIC.md) implemented in `globals.css` — dark canvas, Electric Teal accent, Geist fonts, CSS variables
- **AI provider**: Interface + SimulationProvider + ProductionProvider stub in `src/lib/ai/`
- **shadcn/ui**: Configured (`components.json`), no components installed yet
- **Directory structure**: All 44 directories from ARCHITECTURE.md Section 2
- **Env**: `.env.local` populated with Supabase, Upstash Redis, QStash credentials
- **Verification**: `pnpm tsc --noEmit` (zero errors), `pnpm dev` (starts in ~360ms), `pnpm db:generate` (15 tables)

## Phase 1 — Complete (2026-03-23)

Database, Auth & Google Data Ingestion. All 13 completion tests pass.

- **Vercel**: Live at `citare.vercel.app`, auto-deploys on push to main. Framework preset: Next.js.
- **Database live**: All 15 tables in Supabase (applied via MCP migrations, not `db:push` — local `DATABASE_URL` has connection issues with `postgres` driver, use Supabase MCP for DDL)
- **RLS policies**: All 15 tables have RLS enabled. Helper functions `get_user_role()`, `get_user_agency_id()`, `get_user_client_id()` map `auth.uid()` → `users` table. Super admin full access, agency sees own clients, client sees own data.
- **Supabase Auth**: `@supabase/ssr` with cookie-based sessions. Server/browser/middleware client variants in `src/lib/supabase/`.
- **Auth middleware**: `src/middleware.ts` — session refresh with error handling (try/catch so public routes work even if Supabase call fails), redirect unauthenticated to `/login`.
- **Login page**: `src/app/(auth)/login/page.tsx` — email/password, Citare branding, Suspense-wrapped.
- **Super admin**: ravirdp@gmail.com seeded in `users` table (auth_provider_id: `7a30f68a-6a64-4a17-b3a8-9cbcb59589b4`)
- **Google OAuth flow** (data ingestion, separate from login):
  - `src/lib/integrations/google/oauth.ts` — auth URL, code exchange, token refresh, AES-256-GCM encrypt/decrypt
  - `GET /api/auth/google?clientId=xxx` → consent screen (Ads, GBP, SC, Analytics scopes)
  - `GET /api/auth/google/callback` → encrypts tokens, creates 4 `data_sources` rows
- **Four Google integrations** (all follow `_template.ts` pattern):
  - `google/ads.ts` — campaigns, keywords, performance, geo targeting (`google-ads-api`)
  - `google/gbp.ts` — business info, locations, categories, hours (`googleapis`)
  - `google/search-console.ts` — queries, pages, devices, countries (`googleapis`)
  - `google/analytics.ts` — top pages, traffic sources, geo breakdown (`googleapis`)
- **Ingestion orchestrator**: `src/lib/integrations/orchestrator.ts` — `Promise.allSettled`, per-source error isolation
- **API routes**: `POST /api/ingest/trigger`, `GET /api/ingest/status/[clientId]`
- **Admin clients page**: `src/app/(admin)/clients/page.tsx` — status indicators, Connect Google + Trigger Ingestion
- **shadcn/ui components**: button, input, label, card
- **Build**: `pnpm tsc --noEmit` zero errors, `pnpm build` succeeds

**Known issues:**
- `DATABASE_URL` (transaction pooler port 6543) fails with `postgres` npm driver locally — password auth error. Use Supabase MCP for DB operations. Runtime on Vercel untested yet (may need `?sslmode=require` or switch to session pooler).
- Google API integrations are structurally complete but not yet end-to-end tested with real API data. First real test will happen when you connect a Google account via the OAuth flow.

## Phase 2 — Complete (2026-03-23)

Knowledge Graph & Presence Layer. All 12 completion tests pass.

- **Test data seeded**: 3 test businesses (Clinique Bangalore, Leverage Edu, KR Packers Jaipur) with 12 data_sources via Supabase MCP. Script: `scripts/seed-data/seed.ts`.
- **Knowledge Graph types**: `src/lib/knowledge-graph/types.ts` — full interfaces (BusinessProfile, KGService, KGProduct, KGCompetitor, ConfidenceScores, Conflict, DecisionRadiusMap, etc.)
- **KG database operations**: `src/lib/knowledge-graph/queries.ts` (reads), `builder.ts` (create/update/rollback with atomic `db.transaction()` versioning), `synthesize.ts` (orchestration)
- **AI provider types updated**: `src/lib/ai/provider.ts` — placeholder `unknown[]` types replaced with real KG types from `knowledge-graph/types.ts`
- **Simulation mode**: Deterministic prompt IDs (`kg-synthesize-{clientId}` instead of `Date.now()`). SimulationProvider writes prompts, developer processes via Claude Max, places response files.
- **Strategist prompts**:
  - `src/lib/ai/prompts/strategist/synthesize-kg.ts` — KG synthesis from raw Google data
  - `src/lib/ai/prompts/strategist/classify-decision-radius.ts` — planned/considered/impulse classification
  - `src/lib/ai/prompts/strategist/multi-lang.ts` — English + Hindi + Hinglish (NOT translation)
  - `src/lib/ai/prompts/strategist/generate-presence.ts` — presence content from KG
  - Review files: `simulation/prompts/REVIEW-*.md` for manual prompt iteration
- **KG API routes**: GET/PATCH `/api/kg/:clientId`, GET `/api/kg/:clientId/history`, POST `/api/kg/:clientId/rollback/:version`, POST `/api/kg/:clientId/synthesize`
- **Five presence generators** (all with defensive null guards for incomplete KG data):
  - `src/lib/presence/json-ld.ts` — Schema.org LocalBusiness JSON-LD (90%+ properties)
  - `src/lib/presence/llms-txt.ts` — structured plain text for LLM consumption
  - `src/lib/presence/faq.ts` — FAQ page with FAQPage schema markup
  - `src/lib/presence/markdown.ts` — comprehensive heading-structured markdown
  - `src/lib/presence/product-feed.ts` — JSON product/service feed
- **Presence orchestrator**: `src/lib/presence/orchestrator.ts` — SHA-256 content hashing, change detection, `Promise.allSettled` error isolation
- **Presence API routes**: POST `/api/presence/:clientId/generate`, POST `/api/presence/:clientId/deploy`, GET `/api/presence/:clientId/health`
- **Public presence routes** (unauthenticated, middleware allows `/presence/` prefix):
  - `/presence/:slug/json-ld` — `application/ld+json`, 24hr CDN cache
  - `/presence/:slug/llms.txt` — `text/plain`
  - `/presence/:slug/about` — rendered markdown page with embedded JSON-LD
  - `/presence/:slug/faq` — FAQ page with expandable details
  - `/presence/:slug/products` — JSON product feed
- **KG event system**: `src/lib/knowledge-graph/events.ts` — lightweight handler registration (migrates to Redis streams in Phase 3)
- **Admin UI updated**: Synthesize KG / Generate Presence / Deploy buttons, KG version indicator, presence format status dots
- **Build**: `pnpm tsc --noEmit` zero errors, `pnpm build` succeeds (requires `NODE_OPTIONS="--max-old-space-size=4096"` on dev machine)

**Known issues:**
- `pnpm build` OOMs without `NODE_OPTIONS="--max-old-space-size=4096"` on the 8GB dev machine. Works fine on Vercel.
- Next.js 16 warns about deprecated `middleware` file convention — should migrate to `proxy` eventually but not blocking.
- Presence generators use defensive null guards because KG JSONB from simulation mode may have incomplete fields. This is by design — generators handle partial data gracefully.

## Phase 3 — Complete (2026-03-23)

Monitoring Engine & Basic Dashboard. All completion tests pass.

- **Monitoring types**: `src/types/monitoring.ts` — Platform union type, GeneratedQuery, NormalizedResult, PlatformScores, dashboard response types
- **Platform adapter template**: `src/lib/monitoring/platforms/_template.ts` — PlatformAdapter interface + `createSimulationResult()` with deterministic hash-seeded simulation (same query = same result for debugging)
- **Query generation**: `src/lib/monitoring/query-builder.ts` — Generates monitoring queries from KG keywords (service keywords, recommendation queries, best-in-city, Hindi/Hinglish variants). Pure code, no AI dependency.
- **Five platform adapters** (all simulation mode for Phase 3):
  - `src/lib/monitoring/platforms/chatgpt.ts`, `perplexity.ts`, `google-aio.ts`, `gemini.ts`, `claude.ts`
  - Registry: `platforms/index.ts` — `PLATFORM_ADAPTERS` map + `getActivePlatforms()`
- **Scout execution pipeline**: `src/lib/monitoring/runner.ts` — `runMonitoringForClient()` (sequential per platform, `Promise.allSettled` per query), `runMonitoringForAll()` (sequential per client)
- **Result processing**: `src/lib/monitoring/result-processor.ts` — Code-based parsing (no AI), accuracy check against KG data
- **Visibility scoring**: `src/lib/monitoring/scoring.ts` — Formula: mentionRate × 0.5 + positionScore × 0.3 + accuracyScore × 0.2. Per-platform and per-item breakdowns. Equivalent ad spend: CPC × mentions.
- **Event system**: `src/lib/queue/client.ts` (Upstash Redis + QStash clients), `events.ts` (XADD/XREVRANGE event emitters), `handlers/monitoring.ts` (log-only handlers)
- **Monitoring API routes**:
  - POST/GET `/api/monitor/queries/:clientId` — generate/list monitoring queries
  - POST `/api/monitor/run/:clientId` — trigger monitoring for one client
  - POST `/api/monitor/run-all` — trigger batch monitoring
  - GET/POST `/api/monitor/scores/:clientId` — get/compute visibility scores
  - GET/POST `/api/monitor/results/:clientId` — get/process monitoring results
- **Dashboard API routes**:
  - GET `/api/dashboard/:clientId/overview` — scores, trends, competitors
  - GET `/api/dashboard/:clientId/competitors` — competitor aggregation
  - GET `/api/dashboard/:clientId/items` — per-service/product scores
- **Dashboard UI** (dark theme, Citare design system):
  - Layout with fixed 240px sidebar (`src/app/(dashboard)/layout.tsx`)
  - Sidebar with nav items: Overview, Services, Competitors, Monitoring (`src/components/dashboard/sidebar.tsx`)
  - Client selector dropdown with URL param persistence (`src/components/dashboard/client-selector.tsx`)
  - Dashboard components: MetricCard, VisibilityRing (SVG), PlatformBar, TrendChart (Recharts), CompetitorTable
  - Overview page: 4 metric cards, platform breakdown, 30-day trend chart, competitor table
  - Services page: per-service cards with visibility scores and platform breakdown
  - Competitors page: competitor table with mentions and positions
  - Monitoring page: recent results table with platform filter
- **Admin UI updated**: Generate Queries + Run Monitoring buttons with auto-score computation
- **shadcn/ui components added**: table, badge, tabs, separator, select
- **Build**: `pnpm tsc --noEmit` zero errors, `pnpm build` succeeds (30 routes)

**Known issues:**
- Monitoring uses simulation mode only — all platform responses are deterministic hash-seeded simulations. Production adapters stub with "not yet implemented".
- Event system emitters are defined but not yet wired into the monitoring pipeline (event emission calls not added to runner/scoring yet — consumers log-only).
- Dashboard trend chart shows 1 data point per score computation; need 3+ days of monitoring runs for meaningful trend visualization.

## Phase 4 — Complete (2026-03-23)

Agency System & Super Admin Console. Multi-tenancy enabled.

- **Auth helper**: `src/lib/auth/user.ts` — `getAuthUser()`, `getAuthUserWithAgency()`, `requireAuth()`, `requireRole()`. Bridges Supabase Auth UID → users table (role, agencyId, clientId).
- **Role-based middleware**: `src/middleware.ts` — Route protection by role (super_admin → admin paths, agency_admin/member → /agency/*, client → dashboard). Role cached in `x-citare-role` cookie (15-min TTL, cleared on logout). Uses Supabase PostgREST (Edge Runtime compatible, not Drizzle).
- **Admin layout**: `src/app/(admin)/layout.tsx` with sidebar (Clients, Agencies, Health, Costs). Super admin only.
- **Agency CRUD API routes**:
  - `POST/GET /api/admin/agencies` — create/list agencies (with optional admin user creation via `supabaseAdmin.auth.admin.createUser`)
  - `GET/PATCH /api/admin/agencies/:agencyId` — get/update agency
  - `GET/POST /api/admin/agencies/:agencyId/users` — manage agency users
  - `GET/POST /api/agency/clients` — agency-scoped client management
  - `GET/PATCH /api/agency/settings` — agency settings + branding (hex color validation)
- **Agencies management page**: `src/app/(admin)/agencies/` — list all agencies with client counts, "Create Agency" dialog with admin user creation
- **Test agency seeded**: "Test Agency" (slug: test-agency, accent: #6366F1), KR Packers assigned to it
- **Agency pages** (at `/agency/*`, not route group to avoid Next.js parallel route conflict):
  - `src/app/agency/layout.tsx` — agency layout with sidebar
  - `src/app/agency/clients/` — agency client list with status dots, create client dialog
  - `src/app/agency/settings/` — name, branding (accent color + logo URL), live preview
  - `src/app/agency/billing/` — placeholder (no Stripe in Phase 4)
- **Agency branding injection**: Dashboard layout loads agency branding, overrides `--accent-primary` CSS variable via inline `<style>` tag. Sidebar shows agency name/logo instead of "Citare" with "Powered by Citare" subtitle.
- **Dashboard client filtering**: Role-based: super_admin sees all, agency users see their agency's clients, client users see only their own.
- **Super admin health page**: `src/app/(admin)/health/` — Pings Supabase, Redis, QStash with timing. Status dots + response times. Auto-refresh 30s. Model routing dropdowns (3 tiers) + failover config.
- **Super admin costs page**: `src/app/(admin)/costs/` — Aggregate api_usage_logs by provider/tier/client. Metric cards (today/week/month). Per-client breakdown table.
- **Admin clients enhanced**: Status summary cards (onboarding/active/paused/churned counts), agency name column, status filter tabs.
- **Model routing + failover**: Redis-backed config (`citare:config:model_routing`, `citare:config:failover`). GET/POST APIs + UI controls on health page.
- **shadcn/ui components added**: dialog, dropdown-menu, switch, progress, avatar, tooltip
- **Build**: `pnpm tsc --noEmit` zero errors, `pnpm build` succeeds (48 routes)

**Known issues:**
- Agency route group changed from `(agency)` to `/agency/` to avoid Next.js parallel route conflict with `(admin)/clients`.
- Agency reports page deferred to Phase 5 (monthly reports with shareable links).
- No Stripe billing integration yet — billing page is a placeholder.
- MCC integration deferred — no auto-listing of Google Ads client accounts.
- Email alerts (Resend) not yet wired to health status changes.

## Reference Documents

- `citare-product-bible-v3.docx` — Complete product vision, 14 sections
- `citare-api-data-bible.docx` — API data mapping, privacy policy, contract language
- `citare-pl.xlsx` — Financial model with editable assumptions
