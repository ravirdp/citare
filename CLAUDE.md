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

## Phase 1 — In Progress (2026-03-23)

Database, Auth & Google Data Ingestion.

**Completed:**
- **Database live**: All 15 tables pushed to Supabase via MCP migrations (tables + FK constraints + indexes)
- **RLS policies**: Applied for all tables — super_admin full access, agency sees own clients, client sees own data. Helper functions: `get_user_role()`, `get_user_agency_id()`, `get_user_client_id()`
- **Supabase Auth**: `@supabase/ssr` integrated with cookie-based sessions. Three client variants: server (`src/lib/supabase/server.ts`), browser (`src/lib/supabase/client.ts`), middleware (`src/lib/supabase/middleware.ts`)
- **Auth middleware**: `src/middleware.ts` — session refresh, redirect unauthenticated to `/login`, public routes exempted
- **Login page**: `src/app/(auth)/login/page.tsx` — email/password with Citare branding, Suspense-wrapped for `useSearchParams`
- **OAuth callback**: `src/app/(auth)/callback/page.tsx`
- **Google OAuth flow** (data ingestion, separate from login auth):
  - `src/lib/integrations/google/oauth.ts` — auth URL generation, code exchange, token refresh, encrypt/decrypt
  - `GET /api/auth/google?clientId=xxx` — initiates consent screen with Ads, GBP, SC, Analytics scopes
  - `GET /api/auth/google/callback` — exchanges code, encrypts tokens, creates 4 `data_sources` rows per client
- **Encryption**: `src/lib/utils/encryption.ts` — AES-256-GCM for OAuth token storage
- **Integration template**: `src/lib/integrations/_template.ts` — `DataSourceIntegration` interface
- **Four Google integrations** (all follow template pattern):
  - `google/ads.ts` — campaigns, keywords, performance, geo targeting (via `google-ads-api`)
  - `google/gbp.ts` — business info, locations, categories, hours (via `googleapis`)
  - `google/search-console.ts` — queries, pages, devices, countries (via `googleapis`)
  - `google/analytics.ts` — top pages, traffic sources, geo breakdown (via `googleapis`)
- **Ingestion orchestrator**: `src/lib/integrations/orchestrator.ts` — parallel execution via `Promise.allSettled`, error isolation per source
- **Ingestion API routes**: `POST /api/ingest/trigger`, `GET /api/ingest/status/[clientId]`
- **Admin clients page**: `src/app/(admin)/clients/page.tsx` — lists clients with data source status, Connect Google + Trigger Ingestion buttons
- **Overview page**: `src/app/(dashboard)/overview/page.tsx` — authenticated landing page
- **React Query**: `src/app/providers.tsx` wrapping root layout
- **Type definitions**: `src/types/database.ts`, `src/types/api.ts`, `src/types/integrations.ts`
- **shadcn/ui components**: button, input, label, card installed
- **Build**: `pnpm tsc --noEmit` zero errors, `pnpm build` succeeds, `pnpm dev` starts in ~500ms

**Still needed to complete Phase 1:**
- Vercel deployment verified (env vars set, auto-deploy on push)
- Super admin user created in Supabase Auth + seeded in `users` table (script at `scripts/seed-admin.ts`)
- End-to-end test: login → connect Google → trigger ingestion → verify raw data in Supabase

## Reference Documents

- `citare-product-bible-v3.docx` — Complete product vision, 14 sections
- `citare-api-data-bible.docx` — API data mapping, privacy policy, contract language
- `citare-pl.xlsx` — Financial model with editable assumptions
