# CITARE — Build Plan & Phase Map
## Version 1.0 — March 2026

> **How to use this document**: Each phase has a vision, architecture connections, deliverables, and manual tests. A phase is only complete when every test passes. Do not start Phase N+1 until Phase N tests pass. Update CLAUDE.md with completion status after each phase.

---

## Phase 0: Project Skeleton ✅ COMPLETE (2026-03-22)

### Vision
Set up the entire project foundation so every future module has a home. No features — just structure, tooling, and configuration.

### What Was Built
- Next.js 16 + TypeScript strict + App Router + Tailwind CSS 4 + pnpm
- Drizzle schema with 15 tables, migration generated (not yet applied to Supabase)
- Full Citare aesthetic from AESTHETIC.md implemented in globals.css
- AI Provider interface + SimulationProvider + ProductionProvider stub
- shadcn/ui configured (components.json), no components installed yet
- All 44 directories from ARCHITECTURE.md Section 2 created
- Git initialized, pushed to github.com/ravirdp/citare
- .env.local populated with Supabase, Upstash Redis, QStash credentials

### Architecture Connection
- ARCHITECTURE.md Section 2 (Project Structure) — fully implemented
- ARCHITECTURE.md Section 3 (Database Schema) — Drizzle types generated, not yet in Supabase
- ARCHITECTURE.md Section 5.2 (Simulation Mode) — SimulationProvider stub created
- AESTHETIC.md Section 2 (Color System) — CSS variables in globals.css

### What This Opens Up
Everything. Every subsequent phase builds on this skeleton. The directory structure, database schema, AI abstraction, and design tokens are the foundation.

### Deferred to Phase 1
- `db:push` to apply migration to live Supabase
- Supabase Auth setup + RLS policies
- shadcn/ui components (install as needed)

---

## Phase 1: Database, Auth & Google Data Ingestion

### Vision
Make the system capable of receiving a real Google account connection, pulling real data from Google APIs, and storing it in a live database. By the end of this phase, you connect a Google account and see raw data from Ads, Business Profile, Search Console, and Analytics sitting in your Supabase database. This is the plumbing that everything else depends on.

### Architecture Connection
- ARCHITECTURE.md Section 3.2 — Push schema to Supabase, set up RLS policies
- ARCHITECTURE.md Section 6.1 — Auth & onboarding API routes
- API Bible Sections 2–5 — Google Ads, GBP, Search Console, Analytics data collection
- Product Bible Section 2.1 — Layer One: Intelligence & Data Ingestion

### Deliverables

**1.0 Vercel Deployment (Do First)**
- Connect github.com/ravirdp/citare to Vercel
- Set all environment variables in Vercel dashboard (mirror .env.local)
- Verify auto-deploy on push to main branch works
- Site live at citare.vercel.app (or custom subdomain)
- Every subsequent deliverable is automatically live on push — no separate "deployment phase" ever needed

**1.1 Database Live**
- Apply Drizzle migration to Supabase (`db:push`)
- Verify all 15 tables exist in Supabase dashboard
- Set up Row Level Security policies (agency sees own clients, client sees own data, admin sees all)
- Create the super_admin user manually in Supabase Auth

**1.2 Supabase Auth**
- Configure Supabase Auth with email/password (for admin and agency login)
- Configure Google OAuth provider in Supabase (for client onboarding)
- Auth middleware in Next.js — protect dashboard and admin routes
- Login page with Citare branding (first use of AESTHETIC.md in real UI)

**1.3 Google OAuth Flow**
- Single OAuth flow requesting scopes for: Google Ads (read-only), Google Business Profile (read-only), Google Search Console (read-only), Google Analytics GA4 (read-only)
- OAuth callback handler that stores encrypted tokens in data_sources table
- Support for both MCC (agency manager account) and direct client accounts
- Token refresh mechanism (Google tokens expire, must auto-refresh)

**1.4 Data Ingestion Pipeline**
- Google Ads integration: pull campaigns, ad groups, keywords, bids, spend, conversions, geographic targeting, landing page URLs
- Google Business Profile integration: pull business name, address, hours, categories, services, reviews, Q&A, photos, attributes, GBP insights
- Google Search Console integration: pull organic queries, impressions, CTR, positions, top pages
- Google Analytics integration: pull top pages, traffic sources, geographic breakdown, branded search trends
- Each integration writes raw_data to the data_sources table as JSONB
- Each integration follows the `_template.ts` pattern from `src/lib/integrations/`
- Error handling: if one API fails, others continue; errors logged in data_sources.error_log

**1.5 Ingestion Trigger & Status**
- API route: POST `/api/ingest/trigger` — kicks off data pull for a client
- API route: GET `/api/ingest/status/:clientId` — returns progress (which sources connected, which synced, any errors)
- Basic status page showing ingestion progress (can be minimal UI, just functional)

### Manual Tests to Declare Phase 1 Complete

| # | Test | Expected Result |
|---|------|----------------|
| 1 | Push to main → check Vercel dashboard | Build succeeds, site live at citare.vercel.app within 60 seconds |
| 2 | Open Supabase dashboard → check all tables exist | 15 tables visible with correct columns |
| 3 | Navigate to /login → sign in with admin email | Successfully authenticated, redirected to dashboard |
| 4 | Navigate to a protected route without auth | Redirected to /login |
| 5 | Click "Connect with Google" on a test client | Google OAuth consent screen appears with correct scopes |
| 6 | Complete OAuth flow with a real Google account | Tokens stored in data_sources table, status shows "connected" |
| 7 | Trigger ingestion for the connected client | Data appears in data_sources.raw_data for each Google API |
| 8 | Check Google Ads raw data | Contains campaigns, keywords, bids, spend — matches what's in the actual Google Ads account |
| 9 | Check GBP raw data | Contains business name, address, hours, reviews, services |
| 10 | Check Search Console raw data | Contains organic queries with impressions and positions |
| 11 | Check Analytics raw data | Contains top pages, traffic sources, geographic data |
| 12 | Disconnect one API (e.g., revoke Analytics) and re-trigger ingestion | Other 3 APIs still pull successfully; Analytics shows error in error_log |
| 13 | Check RLS: create a second client, verify data isolation | Client A's data is not visible when querying as Client B |

### What This Opens Up
- Phase 2 can synthesize this raw data into a knowledge graph
- The Google Ads keywords become the foundation for monitoring queries (Phase 3)
- The GBP data feeds directly into structured data generation (Phase 2)
- Attribution Signal 2 (Analytics) and Signal 3 (GBP) are available from day one

---

## Phase 2: Knowledge Graph & Presence Layer

### Vision
Transform raw Google data into an intelligent knowledge graph, then generate all structured data formats from that knowledge graph and deploy them as a live, publicly accessible profile. By the end of this phase, you can visit a URL and see a complete, multi-language, schema-validated presence for a real business — generated entirely from their Google Ads and GBP data.

### Architecture Connection
- ARCHITECTURE.md Section 3.2 — knowledge_graphs table, knowledge_graph_history
- ARCHITECTURE.md Section 5.1 — AI Provider strategist interface
- ARCHITECTURE.md Section 6.2 — Knowledge Graph API routes
- ARCHITECTURE.md Section 6.3 — Presence Layer API routes and public endpoints
- Product Bible Section 2.1 — Knowledge Graph Synthesis
- Product Bible Section 2.2 — Presence Deployment (all 5 formats, all 3 deployment methods)
- Product Bible Section 2.3 — Location Intelligence (landmarks, decision radius)
- Product Bible Section 2.4 — Multi-language & Hinglish Support
- AESTHETIC.md — Hosted profile pages should follow the design system

### Deliverables

**2.1 Knowledge Graph Builder**
- Tier One strategist prompt that takes raw data from all Google sources and synthesizes:
  - Business profile (name, description, contact, address, landmarks, hours, attributes)
  - Services list with descriptions, categories, and prominence scores (based on ad spend)
  - Competitor identification (from competitor keywords in Google Ads)
  - Decision-radius classification per service (planned/considered/impulse)
  - Voice profile (how the business describes itself, extracted from ad copy and GBP description)
  - Confidence scores per data point (sourced from which APIs agree/disagree)
  - Conflict detection (when sources disagree — e.g., different hours in Ads vs GBP)
- Using SimulationProvider: generate the prompt, process through Claude Max, parse response into knowledge_graphs table
- Knowledge graph versioning: every update creates a history entry in knowledge_graph_history
- Manual edit capability: PATCH `/api/kg/:clientId` for agency/client corrections

**2.2 Landmark & Location Processing**
- Parse client's landmark description ("near Jehangir Hospital, opposite Phoenix Mall")
- Augment with Google Business Profile nearby places
- Augment with geographic terms from Google Ads campaigns
- Store in knowledge_graphs.business_profile.landmarks

**2.3 Multi-Language Content Generation**
- Strategist prompt variant that generates content in: English (base), Hindi, Hinglish, and one regional language based on client's selected languages
- Hinglish is not translation — it's natural query-language generation
- Each service/product in the knowledge graph has a multi_lang object with variants
- Use SimulationProvider for generation, test quality manually

**2.4 Presence Content Generation**
- JSON-LD generator: LocalBusiness or specific subtypes with 90%+ properties filled
- llms.txt generator: structured plain text summary for LLM consumption
- FAQ page generator: question-answer pairs from keywords, KG, and business data. Multi-language.
- Structured markdown page generator: comprehensive, heading-structured, human-readable
- Product/service feed generator: XML/JSON with natural language descriptions
- All generators read from the knowledge graph, all output stored in presence_deployments table
- Content hash for change detection (don't regenerate if nothing changed)

**2.5 Hosted Profile Deployment**
- Public routes serving presence content:
  - GET `/presence/:slug/json-ld` — serves JSON-LD
  - GET `/presence/:slug/llms.txt` — serves llms.txt
  - GET `/presence/:slug/about` — serves structured markdown as a rendered page
  - GET `/presence/:slug/faq` — serves FAQ page (multi-language tabs/toggles)
  - GET `/presence/:slug/products` — serves product/service feed
- Schema validation: run JSON-LD through Schema.org validator after generation
- Health check endpoint: GET `/api/presence/:clientId/health`

### Manual Tests to Declare Phase 2 Complete

| # | Test | Expected Result |
|---|------|----------------|
| 1 | Trigger KG synthesis for the test client | Knowledge graph created with business_profile, services, competitors, confidence scores |
| 2 | Check decision-radius classification | Each service classified as planned/considered/impulse with reasoning that makes sense |
| 3 | Check landmark data | Client's manual description + auto-detected landmarks present in KG |
| 4 | Check multi-language content | English + Hindi + Hinglish variants exist for each service. Hinglish reads naturally, not like a translation. |
| 5 | Visit `/presence/{slug}/json-ld` | Valid JSON-LD returned. Copy-paste into Google's Rich Results Test — no errors. |
| 6 | Visit `/presence/{slug}/llms.txt` | Clean, structured text file that clearly describes the business |
| 7 | Visit `/presence/{slug}/faq` | FAQ page renders with questions derived from Google Ads keywords. Multiple language versions accessible. |
| 8 | Visit `/presence/{slug}/about` | Structured markdown page renders as a clean, readable page in the Citare design system |
| 9 | Edit a service in the KG via PATCH | Knowledge graph updates, version increments, history entry created |
| 10 | Re-generate presence after KG edit | Content regenerates, content_hash changes, new version deployed to the same URLs |
| 11 | Check presence health endpoint | Returns status for each format: deployed/healthy/error |
| 12 | Show the hosted profile to someone unfamiliar with the business | They can accurately describe the business from reading the profile pages alone |

### What This Opens Up
- A live URL exists that AI platforms can crawl and index
- The monitoring layer (Phase 3) has something to monitor — "is this content being picked up?"
- The knowledge graph keywords feed directly into monitoring query generation
- The FAQ content matches real search queries, giving AI platforms direct-hit answers

---

## Phase 3: Monitoring Engine & Basic Dashboard

### Vision
Start querying AI platforms daily, collecting results, computing visibility scores, and showing everything in a client dashboard. By the end of this phase, you log in, see a visibility score, platform breakdown, competitive comparison, and trend over time. This is the moment Citare becomes a product, not just a tool — because it proves value.

### Architecture Connection
- ARCHITECTURE.md Section 3.2 — monitoring_queries, monitoring_results, visibility_scores tables
- ARCHITECTURE.md Section 4 — Event system (Redis streams, event types)
- ARCHITECTURE.md Section 5.1 — Scout and Worker interfaces
- ARCHITECTURE.md Section 6.4 — Monitoring API routes
- ARCHITECTURE.md Section 6.5 — Dashboard data API routes
- ARCHITECTURE.md Section 4.3 — Cron schedule (scout queries, result processing, score computation)
- Product Bible Section 2.5 — Layer Three: Monitoring, Proof & Intelligence
- Product Bible Section 5 — Attribution & ROI (Signals 1-4, AI Search Impact Score)
- AESTHETIC.md Sections 4–6 — Dashboard components, metric cards, score rings, charts, navigation

### Deliverables

**3.1 Query Generation**
- From the knowledge graph keywords (Google Ads keywords + organic keywords), generate monitoring queries
- Each query tagged with: language (en, hi, hinglish), source keyword, CPC, focus item (service/product)
- Store in monitoring_queries table
- Query variants: same service queried in multiple phrasings and languages

**3.2 Platform Query Adapters**
- ChatGPT adapter: query via OpenAI API (or simulation mode)
- Perplexity adapter: query via Perplexity API (or simulation mode)
- Google AI Overview adapter: query via SERP API (or simulation mode)
- Gemini adapter: query via Google Gemini API (or simulation mode)
- Claude adapter: query via Anthropic API (or simulation mode)
- Each adapter follows `monitoring/platforms/_template.ts` pattern
- Each returns a normalized RawPlatformResponse: full response text, client mentioned (boolean), position, competitor mentions, information accuracy notes
- Simulation mode: write queries to files, manually run them through each platform, paste results back

**3.3 Scout Execution Pipeline**
- Batch query runner: takes all active queries for a client, runs them across all 5 platforms
- Rate limiting and error handling per platform
- Results stored in monitoring_results table
- Triggerable via: API route POST `/api/monitor/run/:clientId` or batch POST `/api/monitor/run-all`

**3.4 Tier Two Result Processing**
- Worker processes raw monitoring results:
  - Categorize: client mentioned / not mentioned / partially mentioned
  - Accuracy check: compare presented info against knowledge graph (are hours correct? prices right?)
  - Competitor extraction: which competitors appear, at what position, with what info
  - Summary generation: concise summary of each platform's response
- Using SimulationProvider or lightweight parsing for initial implementation

**3.5 Visibility Score Computation**
- Daily aggregation of monitoring results into visibility_scores table
- Overall visibility score (0-100): weighted composite across platforms and queries
- Per-platform scores: { chatgpt: 72, perplexity: 85, ... }
- Per-service/product scores: how each focus item performs individually
- Equivalent ad spend value: CPC × query appearances = estimated monthly ad value in ₹
- Competitive comparison: client position vs each competitor per query

**3.6 Event System (Basic)**
- Upstash Redis streams setup
- Core events flowing: data_source.changed → kg.updated → presence.generated → monitoring.queries_queued
- Event emitters in each layer, basic consumers that log events
- This doesn't need to be fully autonomous yet — just the plumbing working

**3.7 Client Dashboard**
- Sidebar navigation following AESTHETIC.md patterns
- Overview page:
  - Metric cards row: Visibility Score (ring), Queries Monitored, AI Search Value (₹), Competitors Tracked
  - Platform breakdown bar (color-coded per AESTHETIC.md platform colors)
  - Visibility trend chart (line chart, last 30 days, Recharts)
  - Competitive comparison section (race-position format)
- Service/Product drill-down page:
  - Per-item cards with visibility score, platform breakdown, trend
  - Accuracy flags if AI presents incorrect information
- Basic recommendations panel (manually generated for now, structure in place)
- All dashboard data via API routes in Section 6.5

### Manual Tests to Declare Phase 3 Complete

| # | Test | Expected Result |
|---|------|----------------|
| 1 | Check monitoring_queries for the test client | 30-50 queries generated from Google Ads keywords in English + Hindi + Hinglish |
| 2 | Run scout for one query on one platform (manually in simulation mode) | Result stored in monitoring_results with client_mentioned, position, competitor_mentions |
| 3 | Run full scout batch for the test client (all queries, all platforms) | monitoring_results populated for all platform × query combinations |
| 4 | Process results through Tier Two | response_summary populated, accuracy_issues flagged where applicable |
| 5 | Compute visibility scores | visibility_scores row created for today with overall_score, platform_scores, item_scores |
| 6 | Log in to dashboard → Overview | Visibility score ring displays with correct number. Metric cards show real data. |
| 7 | Check platform breakdown bar | All 5 platforms shown with correct per-platform scores and colors |
| 8 | Check visibility trend chart | Shows at least 1 data point (today). Chart renders correctly with Recharts. |
| 9 | Check competitive comparison | Competitors listed with their positions for each focus service. Client position highlighted. |
| 10 | Navigate to service drill-down | Per-service visibility scores match the overview aggregate |
| 11 | Check equivalent ad spend value | ₹ amount shown, calculated from CPC × appearances. Number is plausible. |
| 12 | Check event system | Redis streams show events for today's monitoring run. Events appear in correct order. |
| 13 | Run monitoring for 3 consecutive days | Trend chart shows 3 data points. Trend direction (up/down) is correct. |
| 14 | Show dashboard to someone unfamiliar | They can answer: "Is this business visible in AI search? Is it improving? Who are the competitors?" |

### What This Opens Up
- The product is now demonstrable — you can show agencies a working dashboard with real data
- Daily monitoring data accumulates, making trend analysis meaningful within weeks
- The attribution model (Phase 5) has its first signal: AI visibility data
- The feedback loop exists conceptually — monitoring reveals gaps, presence layer can be updated

---

## Phase 4: Agency System & Super Admin Console

### Vision
Make Citare multi-tenant. Agencies can create accounts, onboard clients, see all their clients in one dashboard, and manage everything under their brand. The super admin console gives you visibility into the entire system. By the end of this phase, you can demo the agency experience end-to-end and manage operations from your admin console.

### Architecture Connection
- ARCHITECTURE.md Section 3.1 — Multi-tenancy model, RLS policies
- ARCHITECTURE.md Section 3.2 — agencies, users tables
- ARCHITECTURE.md Section 6.6 — Admin API routes
- Product Bible Section 1.5 — White-Label Agency Model
- Product Bible Section 4 — Super Admin Console (all 7 subsections)
- Product Bible Section 6 — Revenue Model (agency pricing structure)
- AESTHETIC.md Section 6.3 — Super admin console aesthetic

### Deliverables

**4.1 Agency Management**
- Agency registration/creation flow
- White-label subdomain setup (agency.citare.ai/{slug})
- Agency branding: logo upload, accent color customization
- Agency admin can: create clients, view all clients, access any client's dashboard
- Agency member roles (admin, member) with appropriate permissions

**4.2 Client Management Within Agency**
- Agency dashboard: list of all clients with health status dots (green/yellow/red)
- Client creation flow: agency creates client → client receives onboarding link
- Client selector dropdown in dashboard header (switch between clients without page reload)
- MCC integration: if agency connects their Google MCC, list all client accounts for easy onboarding

**4.3 Super Admin Console**
- System health monitoring: all external services with green/yellow/red status and response times
- AI health agent: automated checks every 5 minutes, alerts via email when status changes
- Usage & tier limit tracking: Supabase, Vercel, Redis, QStash usage vs free tier limits
- Per-customer cost drill-down: API calls by tier, cost per provider, monthly total, margin
- Client lifecycle view: onboarding/active/stale/churn-risk counts and lists
- Failover switches: toggle primary/backup for each external service
- Model routing controls: dropdown per AI tier to select provider and model
- Experiment management: create/track A/B tests across the product

**4.4 Agency Reports**
- Monthly report generation for each client (data from visibility_scores + monitoring_results)
- Shareable link or PDF export
- Report includes: overall visibility change, top wins, competitive movements, equivalent ad spend value, recommendations

### Manual Tests to Declare Phase 4 Complete

| # | Test | Expected Result |
|---|------|----------------|
| 1 | Create a new agency account | Agency created with slug, branding defaults set |
| 2 | Agency creates 3 clients | All 3 appear in agency dashboard with status indicators |
| 3 | Onboard one client via the agency flow | Client connects Google, data ingests, KG generates, presence deploys |
| 4 | Switch between clients in agency dashboard | Client selector works, data updates without full page reload |
| 5 | Check RLS: Agency A cannot see Agency B's clients | Query returns empty when Agency A tries to access Agency B's data |
| 6 | White-label branding: set custom accent color and logo | Dashboard renders with agency's color and logo. Citare branding hidden except "Powered by." |
| 7 | Open super admin console → System Health | All external services shown with live status dots and response times |
| 8 | Check per-customer cost drill-down | At least one client shows API call breakdown with costs and margin |
| 9 | Check usage/tier limits | Supabase, Redis, Vercel usage shown as percentage of free tier limits |
| 10 | Toggle a failover switch | Switch from primary to backup method. System logs the switch. Can switch back. |
| 11 | Change model routing for Tier Three | Dropdown updates saved. Next scout run uses the new model (or logs that it would). |
| 12 | Generate monthly report for a client | Report page/PDF shows visibility data, competitive summary, and equivalent ad spend value |
| 13 | Client lifecycle view shows correct counts | Onboarding, active, stale, churn-risk categories populated correctly |

### What This Opens Up
- You can onboard pilot agencies and their clients
- The admin console lets you manage operations without checking each account manually
- Agency reports give agencies something to present in monthly client reviews
- The failover and model routing systems prepare you for production resilience

---

## Phase 5: Intelligence, Attribution & Recommendations

### Vision
Make Citare smart and self-directing. The system generates actionable recommendations, calculates ROI through the four-signal attribution model, and presents the equivalent ad spend value that justifies the subscription. By the end of this phase, the product sells itself — the dashboard shows clear, quantified value.

### Architecture Connection
- ARCHITECTURE.md Section 3.2 — recommendations table, visibility_scores (attribution fields)
- Product Bible Section 2.5 — Actionable Recommendations, Internal Intelligence Engine
- Product Bible Section 5 — Attribution & ROI Measurement (all subsections)
- Product Bible Section 2.1 — E-Commerce Product Focus Model, Product Rich Showcase

### Deliverables

**5.1 Recommendation Engine**
- Tier One strategist generates recommendations based on monitoring data:
  - Content updates: "Add FAQ content for your top 3 services"
  - Gap alerts: "Competitor X appeared for [query] — you don't"
  - Competitive alerts: "Competitor gaining visibility in your category"
  - Accuracy fixes: "AI platforms show wrong hours — we've corrected this"
  - Spend optimization: "You're covered by AI search for these 8 keywords — consider reallocating ad spend"
- Recommendations stored in recommendations table with priority (low/medium/high/critical)
- Dashboard panel showing pending recommendations with one-click approve
- Approved recommendations trigger automatic content regeneration where applicable

**5.2 Four-Signal Attribution Model**
- Signal 1 (AI Visibility): already built in Phase 3 — query appearances across platforms
- Signal 2 (Traffic Correlation): overlay Google Analytics branded search + direct traffic trends against AI visibility timeline
- Signal 3 (Action Correlation): overlay GBP insights (calls, directions, clicks) against visibility timeline
- Signal 4 (Discovery Survey): optional popup/form component ("How did you hear about us?" with AI assistant option) deployable via script injection
- Correlation engine: detect patterns between visibility changes and downstream metric changes

**5.3 AI Search Impact Score**
- Composite score combining all 4 signals
- Dashboard display: "Estimated monthly customer touchpoints from AI search: 340"
- Platform breakdown, query breakdown, correlation with business metrics
- Equivalent ad spend value: CPC × appearances = monthly ₹ value
- This is the number agencies show in review meetings

**5.4 E-Commerce: Product Showcase**
- For e-commerce clients: Product Rich Showcase endpoints per focus product
- Images hosted on Citare CDN (Vercel Blob or Supabase Storage)
- Complete Product schema with Offer markup, ratings, identifiers
- Public endpoint: GET `/presence/:slug/product/:id` serving rich product data
- Shopify/WooCommerce webhook integration for inventory sync (Tier Zero)

**5.5 Feedback Loop Implementation**
- After Tier One makes changes, cooldown period enforced (strategist_cooldown_until in KG)
- Monitoring results feed back into content optimization: if platform X doesn't pick up FAQ content, adjust format
- Event chain fully operational: data change → KG update → presence regeneration → monitoring re-queue

### Manual Tests to Declare Phase 5 Complete

| # | Test | Expected Result |
|---|------|----------------|
| 1 | Recommendations appear for the test client | At least 3 recommendations generated: content update, gap alert, and one other |
| 2 | Approve a recommendation | Status changes to "approved," content regeneration triggers where applicable |
| 3 | Dismiss a recommendation | Status changes to "rejected," recommendation hidden from panel |
| 4 | Check attribution Signal 2 | Google Analytics branded search data overlaid with visibility timeline |
| 5 | Check attribution Signal 3 | GBP actions (calls, directions) overlaid with visibility timeline |
| 6 | AI Search Impact Score appears on dashboard | Composite score displayed with per-signal breakdown |
| 7 | Equivalent ad spend value shown | ₹ amount calculated from CPC × appearances. Number is plausible and compelling. |
| 8 | Check the spend optimization recommendation | System identifies keywords where AI coverage exists and suggests reallocation |
| 9 | Product showcase endpoint (e-commerce) | `/presence/:slug/product/:id` returns rich product data with images, schema, ratings |
| 10 | Feedback loop cooldown | After strategist run, verify cooldown period blocks re-evaluation for 2 weeks |
| 11 | Show attribution data to someone unfamiliar | They can explain the estimated ROI of AI search in rupee terms |

### What This Opens Up
- The product has a quantified ROI story — agencies can justify the subscription
- E-commerce clients have product showcase pages competing with Amazon/Flipkart
- The feedback loop means the system improves autonomously
- Layer 4 meta-intelligence (Phase 6) has rich data to analyze

---

## Phase 6: Meta-Intelligence, Automation & Production Hardening

### Vision
Turn Citare from a product into a self-improving platform. Layer 4 analyzes patterns across all clients, updates rules automatically, and surfaces strategic insights. All cron jobs run autonomously. Email alerts fire when needed. The system operates without human intervention. By the end of this phase, Citare runs itself.

### Architecture Connection
- ARCHITECTURE.md Section 3.2 — meta_intelligence_runs, experiments tables
- ARCHITECTURE.md Section 4.3 — Full cron schedule (all jobs running)
- Product Bible Section 5 — Layer Four: Meta-Intelligence Engine (all subsections)
- Product Bible Section 4.7 — Experiment Management

### Deliverables

**6.1 Layer 4 Meta-Intelligence Pipeline**
- Weekly Opus-class run on anonymized cross-client data
- Anonymization pipeline: strip client IDs, generalize geography to city/region, normalize financial data to percentiles
- Analysis outputs:
  - Platform behavior shifts (which platform changed sourcing behavior)
  - Content effectiveness trends (FAQ vs JSON-LD vs markdown effectiveness)
  - Market opportunity detection (underserved verticals)
  - Language trends (Hinglish vs English query growth)
  - Decision-radius classification validation
  - Cost optimization opportunities
- Outputs stored in meta_intelligence_runs table
- Auto-injection of updated rules into Tier One strategist system prompt
- Surfacing of product roadmap insights in admin console

**6.2 Full Cron Automation**
- All cron jobs from ARCHITECTURE.md Section 4.3 running via Upstash QStash or Vercel Cron
- Tier Zero polling: Google Ads every 6 hours, GBP every 12 hours, Analytics and Search Console daily
- Shopify webhook listener active for real-time inventory changes
- Scout queries running daily at 2am IST
- Result processing at 6am IST
- Visibility scores computed at 7am IST
- Presence health checks daily
- Strategist weekly run on Mondays at 3am
- Strategist monthly run on the 1st at 3am
- Meta-intelligence weekly run on Sundays at 3am
- System health check every 5 minutes

**6.3 Email Alerts**
- Resend integration for transactional emails
- Alert types: system health changes, tier limit warnings, failover triggers, client churn risk, API token expiry
- Weekly agency digest: summary of all clients' visibility changes
- Monthly client report email with link to full report

**6.4 Experiment System**
- Define A/B experiments in admin console
- Example experiments: prompt variants, output format tests, platform query variations
- Track outcomes per experiment, meta-intelligence analyzes which variant won
- Experiment results viewable in admin console

**6.5 Production Hardening**
- Comprehensive error handling across all API routes and background jobs
- Rate limiting on all public endpoints
- Request validation and sanitization
- Logging: structured logs for all API calls, AI invocations, and cron jobs
- Performance optimization: React Query caching, database query optimization, Supabase egress management
- Security review: ensure no tokens in logs, no client data leaks across tenants, CORS properly configured

**6.6 Content Marketing Assets**
- Auto-generated anonymized data for "State of AI Search" style content
- Admin console view showing aggregated cross-vertical trends
- Export capability for blog post data

### Manual Tests to Declare Phase 6 Complete

| # | Test | Expected Result |
|---|------|----------------|
| 1 | Layer 4 meta-intelligence run completes | meta_intelligence_runs row created with findings, actions_taken, roadmap_suggestions |
| 2 | Anonymization verified | Meta-intelligence input contains no client IDs, no exact addresses, no absolute ₹ amounts |
| 3 | Auto-injected rules appear in strategist prompt | Next strategist run includes updated heuristics from meta-intelligence |
| 4 | All cron jobs running on schedule | QStash/Vercel Cron dashboard shows successful executions for all jobs |
| 5 | Leave system running for 7 days without intervention | Data ingests, monitoring runs, scores compute, no errors in logs |
| 6 | Email alert fires on simulated health change | Change a service to "red" status → email received within 5 minutes |
| 7 | Weekly agency digest email received | Contains summary of all clients' visibility changes for the week |
| 8 | Create an experiment, run it across 5 clients | Experiment tracks variants, results visible in admin console |
| 9 | Rate limiting works on public endpoints | Excessive requests return 429 status |
| 10 | Load test: simulate 50 clients' worth of daily operations | System completes all operations within expected time windows without errors |
| 11 | Security check: no tokens in logs | Search all logs for OAuth token patterns — zero matches |
| 12 | Onboard a brand new client end-to-end without touching the system | Agency creates client → client connects Google → KG generates → presence deploys → monitoring starts → dashboard shows data. All automatic. |

### What This Opens Up
- Citare operates autonomously — you can focus on sales and growth instead of operations
- The meta-intelligence makes every client's optimization better over time
- Content marketing assets drive inbound from agencies
- The system is ready for serious scale: 100+ clients without operational bottleneck

---

## Timeline Summary

| Phase | Duration | Cumulative | Key Milestone |
|-------|----------|------------|---------------|
| 0 ✅ | Done | Week 0 | Project skeleton built and verified |
| 1 | 2 weeks | Week 2 | Real Google data flowing into live database |
| 2 | 2 weeks | Week 4 | Live presence URLs with multi-language structured data |
| 3 | 2 weeks | Week 6 | Working dashboard with visibility scores and monitoring |
| 4 | 2 weeks | Week 8 | Multi-tenant agency system + super admin console |
| 5 | 2 weeks | Week 10 | Attribution, recommendations, quantified ROI |
| 6 | 2 weeks | Week 12 | Fully autonomous self-improving platform |

**First pilot agency demo**: After Phase 3 (Week 6)
**First paying pilot agencies**: After Phase 4 (Week 8)
**Full product launch**: After Phase 6 (Week 12)

---

## Rules for Using This Document

1. **Each phase has a clear "done" state.** Don't start the next phase until all tests pass.
2. **Update CLAUDE.md** after completing each phase with what was built and any deferred items.
3. **When prompting Claude Code**, reference the specific phase and deliverable number: "Build Phase 2, deliverable 2.4 — Presence Content Generation. See ARCHITECTURE.md Section 6.3 for the API routes."
4. **If a deliverable is harder than expected**, mark it as deferred in the phase notes and move on. Come back to it before starting the next phase.
5. **Simulation mode first, production mode later.** Don't switch AI_MODE to production until you have paying clients.
6. **This document evolves.** If you discover something during build that changes the plan, update the plan first, then continue building.

---

*This is the map. ARCHITECTURE.md is the territory. CLAUDE.md is the compass. Build the product.*

— End of Document —
