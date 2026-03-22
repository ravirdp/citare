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

## Reference Documents

- `citare-product-bible-v3.docx` — Complete product vision, 14 sections
- `citare-api-data-bible.docx` — API data mapping, privacy policy, contract language
- `citare-pl.xlsx` — Financial model with editable assumptions
