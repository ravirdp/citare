# CLAUDE.md — Citare Project Context

> **Read this first.** This file provides full context for the Citare project. Read ARCHITECTURE.md for detailed technical specifications.

## What Is Citare?

Citare is an AI Search Intelligence Platform that makes businesses visible and accurately represented across AI search platforms (ChatGPT, Perplexity, Google AI Overviews, Gemini, Claude). It ingests business data from Google Ads and other APIs, synthesizes it into a knowledge graph, generates structured data in multiple formats, deploys it for AI discovery, and continuously monitors how the business appears across AI platforms.

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
| Framework | Next.js 16 (App Router), TypeScript strict |
| Database | Supabase (PostgreSQL + Auth + RLS + Storage) |
| ORM | Drizzle ORM |
| Queue/Cache | Removed — was Upstash Redis + QStash (deleted due to runaway costs) |
| Frontend | Tailwind CSS 4 + shadcn/ui + React Query + Recharts |
| Hosting | Vercel (citare.vercel.app, auto-deploy on push to main) |
| AI | Anthropic (Claude), OpenAI, Perplexity, Google Gemini APIs |
| Email | Resend |
| Package Manager | pnpm |

## Developer Machine

```
Dell Inc. 04N9HV — i5-1035G1, 7.53 GiB RAM, 230 GiB disk, Pop!_OS 24.04
```

**Constraints**: No Docker, no local DB, no local Redis. Everything cloud. Max 2-3 dev processes simultaneously. Use pnpm, not npm. All AI processing via API, never local. `pnpm build` requires `NODE_OPTIONS="--max-old-space-size=4096"` on dev machine (works fine on Vercel).

## AI Mode

Controlled by `AI_MODE` env var:
- `simulation`: Prompts written to files, responses read from files. Developer processes them via Claude Max.
- `production`: Real API calls to Anthropic, OpenAI, etc.

**During development, always use simulation mode.**

## Key Files

- `ARCHITECTURE.md` — Complete technical spec (database schema, API routes, event system)
- `src/lib/db/schema.ts` — Drizzle database schema (source of truth, 15 tables)
- `src/lib/ai/provider.ts` — AI provider interface (strategist, worker, scout, meta)
- `src/lib/ai/prompts/` — All AI prompts organized by tier
- `src/lib/integrations/` — External API integrations (Google OAuth, Ads, GBP, SC, Analytics)
- `src/lib/knowledge-graph/` — KG operations (types, queries, builder, synthesize, cooldown)
- `src/lib/presence/` — Output format generators (JSON-LD, llms.txt, FAQ, markdown, product feed)
- `src/lib/monitoring/` — Platform monitoring (5 adapters, query builder, runner, scoring)
- `src/lib/attribution/` — AI search impact attribution engine
- `src/lib/recommendations/` — Intelligent recommendation generator
- `src/lib/reports/` — Monthly report generation
- `src/lib/feedback/` — Automated feedback loop with cooldown
- `src/lib/queue/` — Event system (log-only, Redis fully optional — gracefully returns null if unconfigured)
- `src/lib/auth/user.ts` — Auth helpers (getAuthUser, requireAuth, requireRole)

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
                            → has many → Recommendations
                            → has many → Visibility Scores
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

---

## Phases 0–4 — Complete (2026-03-22 to 2026-03-23)

### Phase 0: Foundation
Next.js 16 + TypeScript strict + App Router + Tailwind CSS 4 + pnpm. Drizzle schema (15 tables), Citare design system (AESTHETIC.md), AI provider interface (simulation + production), directory structure, env config. Git at `github.com/ravirdp/citare`.

### Phase 1: Database, Auth & Google Data Ingestion
Supabase database live (15 tables, RLS on all). Supabase Auth with cookie-based sessions (`@supabase/ssr`). Login page, super admin seeded (ravirdp@gmail.com). Google OAuth flow for data ingestion (Ads, GBP, Search Console, Analytics — 4 integrations following `_template.ts` pattern). Ingestion orchestrator with `Promise.allSettled`. Admin clients page with status indicators. **Note**: DB migrations applied via Supabase MCP (local `DATABASE_URL` with `postgres` driver has password auth issues). Google integrations structurally complete but not yet tested with real API data.

### Phase 2: Knowledge Graph & Presence Layer
3 test businesses seeded (Clinique Bangalore, Leverage Edu, KR Packers Jaipur). Full KG type system, CRUD with atomic versioned transactions, synthesis orchestration. Simulation mode with deterministic prompt IDs. Strategist prompts for KG synthesis, decision radius classification, multi-language, and presence generation. 5 presence generators (JSON-LD, llms.txt, FAQ, markdown, product feed) with defensive null guards. Public presence routes at `/presence/:slug/*` (unauthenticated, CDN-cached). KG event system (lightweight, migrated to log-only in Phase 4).

### Phase 3: Monitoring Engine & Dashboard
5 platform adapters (ChatGPT, Perplexity, Google AIO, Gemini, Claude) — all simulation mode with deterministic hash-seeded results. Query generation from KG keywords (pure code, no AI). Scout execution pipeline, result processing, visibility scoring (mentionRate × 0.5 + positionScore × 0.3 + accuracyScore × 0.2). Dashboard UI with sidebar, client selector, MetricCard, VisibilityRing, PlatformBar, TrendChart, CompetitorTable. Pages: Overview, Services, Competitors, Monitoring. Event system (Upstash Redis + QStash clients, log-only handlers).

### Phase 4: Agency System & Super Admin Console
Auth helpers bridging Supabase Auth → users table. Role-based middleware with cookie-cached roles (15-min TTL). Agency CRUD, branding injection (accent color + logo via CSS variables), agency pages at `/agency/*`. Super admin console: agencies management, health page (Supabase/Redis/QStash status, model routing, failover config), costs page (api_usage_logs aggregation). Test agency seeded ("Test Agency", slug: test-agency). shadcn/ui components: button, input, label, card, table, badge, tabs, separator, select, dialog, dropdown-menu, switch, progress, avatar, tooltip.

### Persistent Known Issues from Phases 0–4
- `DATABASE_URL` (transaction pooler port 6543) fails with `postgres` npm driver locally — use Supabase MCP for DDL operations. Runtime on Vercel works.
- Monitoring uses simulation mode only — production adapters stub with "not yet implemented".
- **Upstash Redis instance deleted** (2026-03-27). Event system is log-only, model routing and failover use hardcoded defaults. Redis client is lazy-loaded and returns null if env vars are missing — app runs fully without Redis. Admin POST routes return friendly "Redis not configured" message. If Redis is re-added in future, just set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` env vars.
- No Stripe billing integration — agency billing page is a placeholder.
- MCC integration deferred — no auto-listing of Google Ads client accounts.
- Email alerts (Resend) not yet wired to health status changes.
- Next.js 16 warns about deprecated `middleware` file convention — should migrate to `proxy` eventually.

---

## Phase 5 — Complete (2026-03-24)

Monthly Reports, Recommendations, Attribution & Feedback Loop.

### AI Search Impact Attribution (`src/lib/attribution/`)
- **Engine** (`engine.ts`): Composite score from 4 weighted signals — AI Visibility (40%), Traffic Correlation (25%), Actions Correlation (25%), Discovery Survey (10%). Pearson correlation with time-lag detection (0–14 days). Significance assessment (strong/moderate/weak/insufficient).
- **Collectors**: `traffic-collector.ts` (branded search + direct traffic from GA), `action-collector.ts` (GBP insights: calls, directions, clicks).
- **Dashboard**: `/impact` page — composite score, monthly touchpoints, ad equivalency (INR), signal breakdown cards, correlation strength.
- **API**: `GET /api/dashboard/[clientId]/attribution`, `POST /api/dashboard/[clientId]/attribution/compute`.

### Intelligent Recommendations (`src/lib/recommendations/`)
- **Generator** (`generator.ts`): Code-based tier-zero analysis (no AI), 5 independent analyzers:
  1. `accuracy_fix` (critical) — AI platforms showing wrong info; auto-applies to regenerate presence
  2. `gap_alert` (high) — Services with <40% mention rate across monitoring queries
  3. `competitive_alert` (medium/high) — Competitors with >50% of client's visibility
  4. `content_update` (medium) — Presence formats stale >30 days
  5. `spend_optimization` (low) — High AI visibility for keywords with paid ad spend
- **Orchestrator** (`orchestrator.ts`): Deduplication against existing pending recommendations + persistence.
- **AI prompt** (`strategist/generate-recommendations.ts`): Simulation-mode ready for Claude Max enhancement.
- **Dashboard**: `/recommendations` page — status filters (all/pending/applied/rejected), Generate button, RecommendationCard with priority/type badges and Approve/Reject actions.
- **API**: `GET /api/dashboard/[clientId]/recommendations` (with status/type filters), `POST .../generate`, `POST .../[id]/approve` (executes action + auto-regenerates presence), `POST .../[id]/reject`.

### Monthly Reports (`src/lib/reports/`)
- **Generator** (`generator.ts`): Aggregates visibility_scores, monitoring_results, recommendations for a given month. Summary metrics (avg visibility, peak score, total queries, ad value), 30-day trend data, top 5 competitors, recommendations summary, auto-generated highlights.
- **AI prompt** (`strategist/monthly-report.ts`): Template for Claude to generate executive narrative.
- **Dashboard**: `/reports` page — month selector, 4 metric cards, highlights, recommendation summary, competitor analysis.
- **Agency reports**: `agency/reports/` — placeholder for shareable client report links.
- **API**: `GET /api/reports/[clientId]/[month]` (retrieve or auto-generate), `POST /api/reports/[clientId]/generate`.

### Feedback Loop (`src/lib/feedback/`)
- **Loop** (`loop.ts`): Automated cycle — check 48-hour cooldown → compute visibility score → generate recommendations → auto-apply critical accuracy fixes → regenerate presence if fixes applied → set cooldown.
- **Cooldown** (`knowledge-graph/cooldown.ts`): 48-hour minimum between full loop runs to prevent thrashing.
- **API**: `POST /api/feedback/[clientId]/run` — manual trigger or schedulable via Vercel Cron.
- Uses direct function calls (not Redis events). Redis removed entirely.

### Product Detail Pages (`src/app/presence/[slug]/product/`)
- Public SEO-optimized detail pages for individual products/services from KG.
- Searches both `products` and `services` arrays. Schema.org Product JSON-LD. Breadcrumbs, images, price, ratings, specs table, use cases.

### UI Additions
- **Components**: `RecommendationCard` (priority/type/status badges, approve/reject with loading states), `SignalCard` (attribution signal display with weight % and availability).
- **Sidebar**: Updated to 7 nav items — Overview, Services, Competitors, Monitoring, Recommendations, Impact, Reports.
- **Agency branding fix**: Dashboard now uses selected client's agency for branding instead of user's own agency. Super admin sees correct branding when switching clients across agencies.
- **Admin clients page**: "Generate Recommendations" button added.

### Phase 5 Known Issues
- AI enhancement of recommendations and reports is simulation-mode only — prompts written, awaiting Claude Max processing. Code-based generation works fully without AI.
- Agency reports page is a placeholder (shareable links not yet implemented).
- Recommendation thresholds tuned for seed data (mentionRate 0.4 for gap alerts, competitor visibility >50%, CPC-less spend optimizations). May need adjustment with real monitoring data.

---

## GTM Phase — In Progress (2026-03-27)

### Landing Page (`src/app/page.tsx`)
Premium dark-theme landing page targeting business owners (not agencies). Server component, zero client JS. 7 sections: fixed nav, hero with dual CTAs, stats row (527%/4.4x/50%), 3-step how-it-works, 2x2 feature cards, free audit CTA with inline form (URL + business name, GET → `/audit?url=&businessName=`), minimal footer. Uses Citare design system vars throughout. Responsive.

### Audit Lead Capture (`src/app/audit/page.tsx`)
Lightweight lead capture form before running free audit. Top section: Website URL + Business Name (pre-filled from homepage query params). Divider, then "Tell us where to send your report" with Name + Email (required, side by side) and Phone + City (optional, side by side). Stored in `audits` table columns: `contact_name`, `contact_email`, `contact_phone`, `contact_city`. Results page (`/audit/[auditId]`) shows full report without auth — shareable URL. CTA at bottom links to `/signup` for continuous monitoring.

### Vercel Deployment
Project linked to `ravirdp-1774s-projects/citare`. Auto-deploys on push to main at `citare.vercel.app`. Vercel CLI installed globally via pnpm. 11 env vars set for production (Supabase, Google OAuth, encryption, AI_MODE=production). Redis/QStash env vars intentionally omitted (instance deleted).

---

## Reference Documents

- `citare-product-bible-v3.docx` — Complete product vision, 14 sections
- `citare-api-data-bible.docx` — API data mapping, privacy policy, contract language
- `citare-pl.xlsx` — Financial model with editable assumptions

<!-- VERCEL BEST PRACTICES START -->
## Best practices for developing on Vercel

These defaults are optimized for AI coding agents (and humans) working on apps that deploy to Vercel.

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons), use Blob or marketplace integrations for preserving state
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (both discontinued); use Marketplace Redis/Postgres instead
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add` (CI/agent-friendly)
- Sync env + project settings with `vercel env pull` / `vercel pull` when you need local/offline parity
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Tune Fluid Compute knobs (e.g., `maxDuration`, memory/CPU) for long I/O-heavy calls (LLMs, APIs)
- Use Runtime Cache for fast **regional** caching + tag invalidation (don't treat it as global KV)
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
- If Enable Deployment Protection is enabled, use a bypass secret to directly access them
- Add OpenTelemetry via `@vercel/otel` on Node; don't expect OTEL support on the Edge runtime
- Enable Web Analytics + Speed Insights early
- Use AI Gateway for model routing, set AI_GATEWAY_API_KEY, using a model string (e.g. 'anthropic/claude-sonnet-4.6'), Gateway is already default in AI SDK
  needed. Always curl https://ai-gateway.vercel.sh/v1/models first; never trust model IDs from memory
- For durable agent loops or untrusted code: use Workflow (pause/resume/state) + Sandbox; use Vercel MCP for secure infra access
<!-- VERCEL BEST PRACTICES END -->
