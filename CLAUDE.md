# CLAUDE.md — Citare Project Context

> **Read this first.** This file provides full context for the Citare project. Read ARCHITECTURE.md for detailed technical specifications.

## What Is Citare?

Citare is an AI Search Intelligence Platform that makes businesses visible and accurately represented across AI search platforms (ChatGPT, Perplexity, Google AI Overviews, Gemini, Claude). It ingests business data from Google Ads and other APIs, synthesizes it into a knowledge graph, generates structured data in multiple formats, deploys it for AI discovery, and continuously monitors how the business appears across AI platforms.

**It is NOT an SEO tool. It optimizes for how AI models consume and recommend information.**

## Architecture Summary

Three layers sharing a central knowledge graph:
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
| Frontend | Tailwind CSS 4 + shadcn/ui + React Query + Recharts |
| Hosting | Vercel (citare.vercel.app → www.citare.ai, auto-deploy on push to main) |
| AI | Anthropic (Claude), OpenAI, Perplexity, Google Gemini APIs |
| Email | Resend |
| Package Manager | pnpm |

**No queue/cache layer.** Upstash Redis + QStash were removed entirely (packages uninstalled 2026-03-28). Event system is log-only. Model routing and failover use hardcoded defaults.

## Developer Machine

```
Dell Inc. 04N9HV — i5-1035G1, 7.53 GiB RAM, 230 GiB disk, Pop!_OS 24.04
```

**Constraints**: No Docker, no local DB. Everything cloud. Max 2-3 dev processes simultaneously. Use pnpm, not npm. All AI processing via API, never local. `pnpm build` requires `NODE_OPTIONS="--max-old-space-size=4096"` on dev machine (works fine on Vercel).

## AI Mode

Controlled by `AI_MODE` env var:
- `simulation`: Prompts written to files, responses read from files. Developer processes them via Claude Max.
- `production`: Real API calls to Anthropic, OpenAI, etc. **Not yet implemented** — all production provider methods throw errors.

**Both local (.env.local) and Vercel production use `AI_MODE=simulation`.** Do not set to `production` until platform adapters and ProductionProvider are implemented.

## Key Files

- `ARCHITECTURE.md` — Complete technical spec (database schema, API routes, event system)
- `src/lib/db/schema.ts` — Drizzle database schema (source of truth, 17 tables)
- `src/lib/ai/provider.ts` — AI provider interface (strategist, worker, scout, meta)
- `src/lib/ai/production.ts` — Production provider (all 14 methods stub with "not yet implemented")
- `src/lib/ai/simulation.ts` — Simulation provider (writes prompts to disk, reads responses)
- `src/lib/ai/prompts/` — All AI prompts organized by tier
- `src/lib/integrations/` — External API integrations (Google OAuth, Ads, GBP, SC, Analytics)
- `src/lib/knowledge-graph/` — KG operations (types, queries, builder, synthesize, cooldown)
- `src/lib/presence/` — Output format generators (JSON-LD, llms.txt, FAQ, markdown, product feed)
- `src/lib/monitoring/` — Platform monitoring (5 adapters — all simulation stubs, query builder, runner, scoring)
- `src/lib/attribution/` — AI search impact attribution engine
- `src/lib/recommendations/` — Intelligent recommendation generator
- `src/lib/reports/` — Monthly report generation
- `src/lib/feedback/` — Automated feedback loop with cooldown
- `src/lib/queue/` — Stub module. `getRedis()` always returns `null`. No Redis dependency.
- `src/lib/auth/user.ts` — Auth helpers (getAuthUser, requireAuth, requireRole)

## Coding Conventions

- TypeScript strict mode, no `any` types unless absolutely necessary
- All database operations through Drizzle ORM, never raw SQL in application code
- All external API calls wrapped in try/catch with proper error handling
- All AI calls go through the AIProvider interface (never call APIs directly)
- Use JSONB for evolving data structures, extract to tables when patterns stabilize
- Every new integration follows the `_template.ts` pattern in its directory
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

## Auth & Signup Flow

### Google OAuth Signup
User clicks "Sign up with Google" → Supabase OAuth → Google consent → `/auth/callback` → exchanges code for session → creates `clients` row (slug auto-generated, status `onboarding`, type `physical`) → creates `users` row with `role: "client"` linked to new client → redirects to `/onboarding`.

### Email Signup
Form at `/signup` → `supabase.auth.signUp()` → email verification → `/auth/callback` → same client + user creation flow → `/onboarding`.

### Role-Based Access
- `super_admin` → `/clients` (admin console)
- `agency_admin` / `agency_member` → `/agency/clients`
- `client` → `/overview` (dashboard)

Agency users can only be created by super_admin via `POST /api/admin/agencies/[agencyId]/users`. No self-service agency registration.

---

## Phases 0–4 — Foundation through Agency System (2026-03-22 to 2026-03-23)

Supabase database (17 tables, RLS on all). Supabase Auth with cookie-based sessions. Login/signup pages. Super admin seeded (ravirdp@gmail.com). Google OAuth for data ingestion (4 integrations). 3 test businesses seeded (Clinique Bangalore, Leverage Edu, KR Packers Jaipur). Full knowledge graph type system with versioned CRUD. 5 presence generators with public routes at `/presence/:slug/*`. 5 monitoring platform adapters (all simulation mode). Dashboard UI (sidebar, client selector, 7 pages). Role-based middleware with cookie-cached roles. Agency system with branding injection. Super admin console (agencies, health, costs). shadcn/ui component library.

## Phase 5 — Attribution, Recommendations, Reports & Feedback (2026-03-24)

### AI Search Impact Attribution (`src/lib/attribution/`)
Composite score from 4 weighted signals — AI Visibility (40%), Traffic Correlation (25%), Actions Correlation (25%), Discovery Survey (10%). Dashboard at `/impact`. API: `GET/POST /api/dashboard/[clientId]/attribution`.

### Intelligent Recommendations (`src/lib/recommendations/`)
Code-based tier-zero analysis (no AI needed), 5 analyzers: accuracy_fix, gap_alert, competitive_alert, content_update, spend_optimization. Deduplication and auto-apply for critical fixes. Dashboard at `/recommendations`. API: `GET/POST /api/dashboard/[clientId]/recommendations`.

### Monthly Reports (`src/lib/reports/`)
Aggregates visibility_scores, monitoring_results, recommendations. Dashboard at `/reports`. Agency reports placeholder at `/agency/reports/`.

### Feedback Loop (`src/lib/feedback/`)
Automated cycle with 48-hour cooldown. API: `POST /api/feedback/[clientId]/run`.

## GTM Phase — In Progress (2026-03-27 to present)

### Public Pages
- **Landing page** (`/`): Dark-theme, server component, 7 sections, free audit CTA form
- **Audit** (`/audit`, `/audit/[auditId]`): Lead capture → run audit → shareable results (no auth required)
- **About** (`/about`): 6 sections, JSON-LD AboutPage schema
- **Contact** (`/contact`): Form → `POST /api/contact/submit` → `contact_submissions` table
- **Privacy** (`/privacy`): Privacy policy covering data collection, usage, retention, third-party services, rights

### SEO & GEO
Open Graph + Twitter Card meta. JSON-LD schemas (Organization, WebSite with SearchAction). `robots.ts`, `sitemap.ts` (static + dynamic presence pages), `llms.txt` route.

### Onboarding Integration OAuth
`POST /api/integrations/google/[serviceId]/auth-url` — returns Google OAuth consent URL scoped per service (ads, gbp, search-console, analytics). Called by onboarding page. Requires auth + clientId.

### Vercel Deployment
Project: `ravirdp-1774s-projects/citare`. Auto-deploys on push to main. Domain: `www.citare.ai`. 11 env vars set (Supabase, Google OAuth, encryption, `AI_MODE=simulation`).

---

## Current Known Issues

- `DATABASE_URL` (transaction pooler port 6543) fails with `postgres` npm driver locally — use Supabase MCP for DDL operations. Runtime on Vercel works.
- **All monitoring adapters are simulation stubs.** Production mode throws "not yet implemented" for all 5 platforms (ChatGPT, Perplexity, Google AIO, Gemini, Claude) and all 14 ProductionProvider methods.
- **Missing API keys**: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `PERPLEXITY_API_KEY`, `GOOGLE_GEMINI_API_KEY`, `SERP_API_KEY` — none configured.
- No Stripe billing integration — agency billing page is a placeholder.
- MCC integration deferred — no auto-listing of Google Ads client accounts.
- Email alerts (Resend) not yet wired to health status changes.
- Next.js 16 warns about deprecated `middleware` file convention — should migrate to `proxy` eventually.
- AI enhancement of recommendations and reports is simulation-mode only. Code-based generation works without AI.
- Agency reports page is a placeholder (shareable links not yet implemented).
- Monitoring runner has no subscription/frequency gating — runs all active queries for any client without checks.
- 3 DB tables unused: `systemHealthLogs`, `experiments`, `metaIntelligenceRuns`.
- 10 API routes have no frontend calling them (KG CRUD, KG history/rollback, admin agency detail/users, per-client costs, monitor run-all).
- Google integrations structurally complete but not tested with real API data.

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
