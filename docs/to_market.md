# CITARE — Go-To-Market Roadmap
## Version 1.0 — March 2026

> **Purpose**: This document maps the path from current state (Phases 0-5 complete, simulation mode) to first paying agencies. Each step has clear deliverables, completion criteria, and manual tests. A step is only complete when every test passes.

---

## Current State

- **Built**: 62 routes, ~120 files, 5 phases complete
- **Working**: Data ingestion, KG synthesis, presence generation (5 formats), monitoring (5 platforms), dashboard (7 pages), agency multi-tenancy, admin console, recommendations, attribution, feedback loop, reports
- **Mode**: Everything runs on simulation data with deterministic hash-seeded results
- **Not yet tested**: Real Google Ads data, real AI platform queries, production deployment with all API keys

---

## GTM Phase 1: Feature Enhancement (Competitive Edge) — Steps 1.1-1.4 COMPLETE

### Status
Steps 1.1 (Citability Scoring), 1.2 (Crawler Access Check), 1.3 (Brand Mention Scanning), and 1.4 (Free Audit Report Generator) built and deployed. Step 1.5 (Recurring Audit Integration) pending — integrates audit scores into monthly reports and trend tracking.

### Vision
Integrate three capabilities borrowed from the GEO-SEO audit approach that make Citare's output more compelling than anything agencies have seen. These features strengthen both the free audit hook and the ongoing monitoring value.

### Step 1.1: Citability Scoring Engine

**What**: Analyze every presence page Citare generates and score it for AI citation readiness. AI platforms prefer content blocks that are 130-170 words, self-contained, fact-rich, and directly answer a question. Score each content block and provide an aggregate citability score per page.

**Deliverables**:
- `src/lib/analysis/citability.ts` — Citability scorer:
  - Split content into blocks (paragraphs, FAQ answers, service descriptions)
  - Score each block on: word count (optimal 134-167), self-containedness (has subject + context + answer), fact density (numbers, names, specifics vs vague claims), question-answer alignment
  - Aggregate page score 0-100
  - Return per-block breakdown with improvement suggestions
- `src/lib/analysis/types.ts` — CitabilityScore, ContentBlock, BlockAnalysis types
- Integration with presence orchestrator: after generating content, auto-score it and store citability score in presence_deployments.metadata JSONB
- API route: `GET /api/presence/:clientId/citability` — returns citability scores for all deployed formats
- Dashboard component: citability score badge on the services page and a summary on the overview page

**Completion Tests**:
| # | Test | Expected Result |
|---|------|----------------|
| 1 | Generate presence for Clinique → check citability scores | Each format has a score 0-100. FAQ page should score highest (Q&A format is inherently citable). |
| 2 | Check per-block breakdown | Individual blocks scored with specific improvement suggestions |
| 3 | Citability score visible on dashboard overview | Score appears as a metric card or badge |
| 4 | Regenerate presence with improved content → score changes | Score reflects content quality changes |

### Step 1.2: AI Crawler Access Check

**What**: When Citare crawls a client's website (using landing page URLs from Google Ads), also fetch and parse their robots.txt to check whether AI crawlers are allowed or blocked. This is a critical finding — if a business blocks GPTBot, they're invisible to ChatGPT no matter how good their content is.

**Deliverables**:
- `src/lib/analysis/crawler-access.ts` — Robots.txt analyzer:
  - Fetch robots.txt from client's website domain
  - Check access rules for 14+ AI crawlers: GPTBot, ChatGPT-User, ClaudeBot, Claude-Web, PerplexityBot, Google-Extended, Googlebot (for AI Overviews), Bingbot (for ChatGPT browse mode), Bytespider (TikTok), Applebot-Extended, FacebookBot, anthropic-ai, cohere-ai, Meta-ExternalAgent
  - Classify each: allowed, blocked, not mentioned (default allowed), conditionally allowed
  - Generate recommendations: which crawlers to allow, suggested robots.txt additions
  - Severity: blocking GPTBot or ClaudeBot = critical; blocking lesser crawlers = informational
- Integration: run during initial website crawl (Layer 1 ingestion) and store results in data_sources.metadata for source_type='website_crawl'
- Auto-generate a recommendation (type: accuracy_fix, priority: critical) if any major AI crawler is blocked
- API route: `GET /api/analysis/:clientId/crawler-access` — returns crawler access report
- Dashboard: crawler access status on the overview page (green = all major crawlers allowed, yellow = some blocked, red = GPTBot or ClaudeBot blocked)

**Completion Tests**:
| # | Test | Expected Result |
|---|------|----------------|
| 1 | Run crawler check on a test URL with known robots.txt | Correctly identifies blocked/allowed crawlers |
| 2 | Simulate a site blocking GPTBot | Critical recommendation auto-generated |
| 3 | Crawler access status visible on dashboard overview | Green/yellow/red indicator showing |
| 4 | Check report includes specific robots.txt fix suggestions | Actionable recommendations with exact directives to add |

### Step 1.3: Brand Mention Scanning

**What**: Beyond monitoring AI platform responses (which Citare already does), scan major platforms where AI models source their training/retrieval data — YouTube, Reddit, Wikipedia, LinkedIn, Quora, industry directories. Brand mentions on these platforms correlate 3x more strongly with AI visibility than backlinks.

**Deliverables**:
- `src/lib/analysis/brand-mentions.ts` — Brand mention scanner:
  - For a given business name + variations, search across: YouTube, Reddit, Wikipedia, LinkedIn, Quora, Justdial, Sulekha, Practo (for healthcare), Google Scholar (for medical/academic)
  - Use web search API (or simulation mode) to find mentions
  - Count mentions per platform, sentiment (positive/negative/neutral if detectable), recency
  - Generate a Brand Authority Score 0-100
  - Compare against competitors' brand mention counts
- `src/lib/analysis/brand-mentions-types.ts` — BrandMention, PlatformMentions, BrandAuthorityScore types
- Store results in a new JSONB field in visibility_scores or a dedicated table
- API route: `GET /api/analysis/:clientId/brand-mentions` — returns brand mention report
- API route: `POST /api/analysis/:clientId/brand-mentions/scan` — trigger a new scan
- Dashboard: brand authority score on impact page alongside the existing attribution signals

**Completion Tests**:
| # | Test | Expected Result |
|---|------|----------------|
| 1 | Run brand mention scan for Clinique (simulation mode) | Returns structured results with platform breakdown |
| 2 | Brand authority score calculated | Score 0-100 with per-platform contribution |
| 3 | Competitor brand mentions compared | Shows relative brand authority vs competitors |
| 4 | Brand authority score visible on impact page | Appears as an additional signal card |
| 5 | Scan for business with strong online presence vs weak one | Scores differ meaningfully |

### Step 1.4: Free Audit Report Generator

**What**: Combine citability scoring, crawler access check, and brand mention scanning into a standalone one-time audit report that can be generated for ANY website URL — without requiring Google Ads access. This is the agency hook.

**Deliverables**:
- `src/lib/audit/generator.ts` — Standalone audit orchestrator:
  - Input: website URL + business name
  - Crawl the website (limited: homepage + up to 10 linked pages)
  - Run citability scoring on crawled content
  - Run robots.txt crawler access check
  - Run brand mention scan
  - Run basic schema.org detection (check existing JSON-LD, microdata)
  - Generate composite GEO Score 0-100 (weighted: citability 25%, crawler access 15%, brand authority 20%, schema completeness 15%, content structure 25%)
  - Generate prioritized action items
- API route: `POST /api/audit/run` — accepts { url, businessName }, returns audit report
- Public audit page: `/audit` — simple form: enter URL + business name → generates report
- Audit report page: `/audit/:auditId` — shareable, no auth required, shows full results with Citare branding and CTA ("Want continuous monitoring? Connect your Google Ads for a free trial")
- Store audit results in a new `audits` table (id, url, business_name, results JSONB, created_at)

**Completion Tests**:
| # | Test | Expected Result |
|---|------|----------------|
| 1 | Visit `/audit` → enter a URL → submit | Audit runs, shows loading state, then results |
| 2 | Audit report shows all 4 sections | Citability, crawler access, brand mentions, schema detection |
| 3 | GEO Score 0-100 displayed prominently | Composite score with breakdown |
| 4 | Action items prioritized | Critical items first (e.g., blocked crawlers), then improvements |
| 5 | Report URL is shareable | `/audit/:auditId` loads without auth |
| 6 | CTA visible | "Connect Google Ads for full monitoring" prominently shown |
| 7 | Run audit on 3 different websites | Scores differ, action items are specific to each site |

### Step 1.5: Recurring Audit Integration (Audit as a Tracked Metric)

**What**: The free audit isn't just a one-time sales hook — it becomes a recurring feature for existing clients. Every month, the same audit (citability, crawler access, brand mentions, schema detection) runs automatically as part of the monitoring cycle. But for clients, it's richer because it combines website analysis WITH Google Ads data, knowledge graph, and AI platform monitoring.

The audit scores become tracked metrics over time, not snapshots. Agencies can show their clients: "When we started, your citability was 45. Now it's 78. Here's the impact on AI visibility."

**Deliverables**:
- Integrate audit scores into the monthly report generator (`src/lib/reports/generator.ts`):
  - Add sections: citability score change (month-over-month), crawler access status, brand authority trend
  - Format: "Citability: 62 → 71 (+14.5%)", "Crawler Access: All major AI crawlers allowed ✓", "Brand Authority: +15% mentions across Reddit and YouTube"
- Store audit scores in visibility_scores table (new JSONB fields or metadata):
  - `citabilityScore` (0-100, from latest presence content analysis)
  - `crawlerAccessStatus` (green/yellow/red + blocked crawler list)
  - `brandAuthorityScore` (0-100, from latest brand mention scan)
- Add trend tracking: the monthly report shows a 3-month trend for each audit metric
- Auto-trigger: when the feedback loop runs (`src/lib/feedback/loop.ts`), also re-run citability scoring on current presence content and update the score
- Dashboard impact page: show citability and brand authority as trend lines alongside the existing visibility score trend

**Completion Tests**:
| # | Test | Expected Result |
|---|------|----------------|
| 1 | Generate monthly report for Clinique | Report includes citability score, crawler status, and brand authority sections |
| 2 | Run feedback loop twice (separated by cooldown) | Citability scores stored at both points, trend visible |
| 3 | View impact page | Citability and brand authority appear as trendable metrics |
| 4 | Month-over-month comparison | Report shows delta ("citability: 62 → 71, +14.5%") |
| 5 | Agency views client report | Audit metrics included with improvement narrative |

---

## GTM Phase 2: Production Readiness

### Vision
Switch from simulation to production for critical paths. Ensure the platform works on real infrastructure with real API keys. The goal is that when an agency connects their client's Google Ads, everything works on the first try.

### Step 2.1: Production Monitoring Adapters

**What**: Switch at least 3 of the 5 platform adapters from simulation to production mode. Priority: ChatGPT (largest AI search market share), Perplexity (fastest growing), and Claude (our own platform — we know the API best).

**Deliverables**:
- Update `src/lib/monitoring/platforms/chatgpt.ts` — production mode using OpenAI API (or web search simulation)
- Update `src/lib/monitoring/platforms/perplexity.ts` — production mode using Perplexity API
- Update `src/lib/monitoring/platforms/claude.ts` — production mode using Anthropic API
- Update `src/lib/monitoring/platforms/google-aio.ts` — production mode using SerpAPI for AI Overview extraction
- Keep `gemini.ts` in simulation mode for now (lowest priority)
- Add API key validation on startup: if production mode is enabled but API key is missing, log warning and fall back to simulation for that adapter
- Add cost tracking: log every production API call to api_usage_logs with tokens used and estimated cost

**Completion Tests**:
| # | Test | Expected Result |
|---|------|----------------|
| 1 | Set AI_MODE=production, run monitoring for one query on ChatGPT | Real response from OpenAI API, stored in monitoring_results |
| 2 | Same for Perplexity | Real Perplexity response |
| 3 | Same for Claude | Real Anthropic response |
| 4 | Run full monitoring for Clinique (all queries, 3 production + 2 simulation platforms) | Mix of real and simulated results, all stored correctly |
| 5 | Check api_usage_logs | Production calls logged with cost estimates |
| 6 | Missing API key → graceful fallback | Adapter falls back to simulation, logs warning |
| 7 | Real competitor names appear in results | Actual competitors from AI responses, not hash-seeded fakes |

### Step 2.2: Google OAuth End-to-End Verification

**What**: Verify the Google OAuth flow works with a real Google account. This doesn't require a real Google Ads account with campaigns — just verify the OAuth handshake, token storage, and API calls don't crash.

**Deliverables**:
- Create a test Google Cloud project with OAuth credentials (if not already done)
- Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel env vars
- Test the OAuth flow: `/api/auth/google?clientId=xxx` → Google consent → callback → tokens stored
- Test each API call with an account that may have zero data:
  - Google Ads: handle "no campaigns" gracefully
  - GBP: handle "no business profile" gracefully
  - Search Console: handle "no verified site" gracefully
  - Analytics: handle "no GA4 property" gracefully
- Verify token refresh works (tokens expire after 1 hour)

**Completion Tests**:
| # | Test | Expected Result |
|---|------|----------------|
| 1 | Click "Connect with Google" → complete OAuth flow | Tokens stored encrypted in data_sources |
| 2 | Trigger ingestion with real (possibly empty) account | No crashes, empty data handled gracefully |
| 3 | Check data_sources.error_log | No errors (or clean "no data found" messages) |
| 4 | Wait 1+ hours → trigger ingestion again | Token auto-refreshes, data pulls successfully |

### Step 2.3: Vercel Production Deployment

**What**: Ensure citare.vercel.app is fully functional with all environment variables set and all features working.

**Deliverables**:
- Audit all env vars in `.env.example` → verify each is set in Vercel dashboard
- Set AI_MODE=production in Vercel (keep simulation locally)
- Verify DATABASE_URL works on Vercel (may need session pooler instead of transaction pooler)
- Test all critical paths on citare.vercel.app:
  - Login works
  - Admin pages load
  - Dashboard shows data for test businesses
  - Public presence URLs work
  - Audit page works
- Set up a custom domain if available (citare.ai or similar)
- Configure Vercel Cron for daily monitoring (optional — can trigger manually for now)

**Completion Tests**:
| # | Test | Expected Result |
|---|------|----------------|
| 1 | Visit citare.vercel.app/login → log in | Authentication works, redirected to admin |
| 2 | Navigate all admin pages | No crashes, data loads |
| 3 | Visit public presence URLs | Content serves correctly |
| 4 | Visit /audit → run an audit | Audit completes, results display |
| 5 | Run monitoring from admin panel | Production API calls work on Vercel |
| 6 | Check Vercel logs | No unhandled errors |

### Step 2.4: Security & Credentials Audit

**What**: Before giving anyone access, ensure no secrets are exposed and the platform is secure.

**Deliverables**:
- Search entire codebase for hardcoded credentials, API keys, passwords → remove any found
- Verify .env.local is in .gitignore and not committed
- Change all passwords set during development:
  - Supabase database password
  - Super admin password
  - Any test user passwords
- Verify RLS policies are working (agency user can't see other agency's data)
- Check CORS configuration on API routes
- Verify OAuth tokens are encrypted at rest (AES-256-GCM confirmed in Phase 1)
- Check that public routes (/presence/*, /audit/*) don't leak private data
- Rate limit the audit endpoint (prevent abuse)

**Completion Tests**:
| # | Test | Expected Result |
|---|------|----------------|
| 1 | grep -r "password\|secret\|api_key" src/ | No hardcoded credentials |
| 2 | .env.local not in git history | Confirmed via git log |
| 3 | Create agency user → try accessing admin routes | Blocked, redirected |
| 4 | Visit /api/admin/* without auth | 401 or redirect |
| 5 | Public presence routes return only business info | No internal data exposed |
| 6 | Hit /api/audit/run 100 times rapidly | Rate limited after threshold |

---

## GTM Phase 3: Comprehensive System Audit

### Vision
Every feature, every flow, every page verified working end-to-end. This is the "sign-off" before approaching agencies.

### Step 3.1: Complete Flow Audit

Test every user journey end-to-end:

**Journey 1: Super Admin creates agency and onboards a client**
| # | Step | Expected |
|---|------|----------|
| 1 | Login as super admin | Lands on /clients |
| 2 | Navigate to /agencies → Create Agency | Agency created with admin user |
| 3 | Agency admin user receives credentials | Can log in |
| 4 | Agency admin logs in | Redirected to /agency/clients |
| 5 | Agency admin creates a client | Client visible with agency association |
| 6 | Client connects Google (OAuth) | Tokens stored, data sources created |
| 7 | Trigger ingestion | Raw data pulled into data_sources |
| 8 | Trigger KG synthesis | Knowledge graph created |
| 9 | Generate presence | 5 formats generated |
| 10 | Deploy presence | Public URLs serve content |
| 11 | Generate monitoring queries | 30-50 queries created |
| 12 | Run monitoring | Results across 5 platforms |
| 13 | View dashboard | Visibility score, charts, competitors visible |
| 14 | Generate recommendations | Actionable recommendations appear |
| 15 | View impact page | Attribution score with signal breakdown |
| 16 | Generate monthly report | Report with visibility trend and highlights |
| 17 | Run feedback loop | Recommendations auto-applied, cooldown set |

**Journey 2: Free audit for a prospect**
| # | Step | Expected |
|---|------|----------|
| 1 | Visit /audit (no login required) | Audit form visible |
| 2 | Enter prospect's website URL + business name | Audit starts processing |
| 3 | Audit completes | GEO Score, citability, crawler access, brand mentions, schema detection |
| 4 | Share audit URL with prospect | Report loads without auth |
| 5 | Prospect sees CTA | "Connect Google Ads for continuous monitoring" |

**Journey 3: Agency views dashboard across multiple clients**
| # | Step | Expected |
|---|------|----------|
| 1 | Agency admin logs in | Sees only their clients |
| 2 | Selects client A | Dashboard shows client A data with agency branding |
| 3 | Switches to client B | Data updates, branding stays (same agency) |
| 4 | Views recommendations for each | Different recommendations per client |
| 5 | Generates monthly report | Report reflects that specific client's data |

### Step 3.2: Page-by-Page UI Audit

Every page tested for rendering, data display, error handling, and empty states:

| Page | Route | Check |
|------|-------|-------|
| Login | /login | Email/password works, redirects by role |
| Admin Clients | /clients | All clients, status cards, filter tabs, all action buttons |
| Admin Agencies | /agencies | Agency list, create dialog, client counts |
| Admin Health | /health | Service status dots, model routing, failover |
| Admin Costs | /costs | Cost cards, per-client table |
| Agency Clients | /agency/clients | Agency's clients only, create dialog |
| Agency Settings | /agency/settings | Branding preview, save works |
| Agency Billing | /agency/billing | Placeholder displayed |
| Dashboard Overview | /overview | Visibility ring, metric cards, platform bar, trend chart, competitor table |
| Dashboard Services | /services | Service cards with scores and platform dots |
| Dashboard Competitors | /competitors | Competitor table with mentions and positions |
| Dashboard Monitoring | /monitoring | Results table, platform filter, timestamps |
| Dashboard Recommendations | /recommendations | Filter tabs, generate button, approve/reject |
| Dashboard Impact | /impact | Composite score, signal cards, correlation display |
| Dashboard Reports | /reports | Month selector, metrics, highlights |
| Public About | /presence/:slug/about | Rendered page with business info |
| Public FAQ | /presence/:slug/faq | Expandable Q&A |
| Public JSON-LD | /presence/:slug/json-ld | Valid Schema.org JSON-LD |
| Public llms.txt | /presence/:slug/llms.txt | Structured plain text |
| Public Products | /presence/:slug/products | Service/product feed |
| Public Product Detail | /presence/:slug/product/:id | Individual product/service page |
| Public Audit | /audit | Form, results, shareable link |

---

## GTM Phase 4: Agency Pitch Materials

### Vision
Create the materials needed to approach agencies confidently. The pitch is simple: "Here's a free audit showing your client's AI search gaps. Connect Google Ads for a free month of continuous monitoring."

### Step 4.1: One-Page Agency Pitch Document

**What**: A single PDF or web page explaining Citare to agencies in 60 seconds.

**Content**:
- Headline: "Your clients are invisible to AI search. We fix that."
- The problem: AI search (ChatGPT, Perplexity, Google AI Overviews) is cannibalizing traditional search. Businesses optimized for Google are invisible to AI.
- What Citare does: Connect Google Ads → auto-generate AI-optimized content → monitor visibility → show ROI
- For agencies: White-label under your brand. New revenue stream. No work for you — fully automated.
- Pricing: ₹5,000/client/month (agency price). You charge ₹15,000-25,000.
- CTA: "Let us run a free audit on one of your clients"

**Format**: Create as a styled HTML page at `/pitch` (public, no auth) AND as a downloadable PDF.

**Completion Tests**:
| # | Test | Expected |
|---|------|----------|
| 1 | Visit /pitch | Styled pitch page loads |
| 2 | Page explains value in under 60 seconds of reading | Clear, concise, no jargon |
| 3 | PDF downloadable | Link works, PDF is well-formatted |
| 4 | CTA links to /audit | Working link |

### Step 4.2: Demo Script

**What**: A written script for demoing Citare to an agency in 10 minutes.

**Content**:
1. Show the free audit (run live on their client's website)
2. Show the dashboard for a demo business (Clinique or similar)
3. Walk through: visibility score → services breakdown → competitors → recommendations
4. Show the impact page ("this is the ₹ value of AI search visibility")
5. Show presence pages ("this is what AI platforms see")
6. Ask: "Want to try this for your client? Give us Google Ads access for 1 month free."

**Format**: Markdown document in the project, not a built feature.

**Completion Tests**:
| # | Test | Expected |
|---|------|----------|
| 1 | Read through the script | Flows naturally, covers all key features |
| 2 | Time the demo | Completable in 10 minutes |
| 3 | All referenced pages/features work | No broken links or missing data during demo |

---

## GTM Phase 5: Agency Outreach & First Clients

### Vision
Approach 5-10 agencies, offer free audits, convert 2-3 to trial users. First real Google Ads data flows through the system.

### Step 5.1: Identify Target Agencies

**Criteria**:
- Digital agencies in Bangalore, Mumbai, Delhi managing Google Ads for 10+ clients
- Active on LinkedIn or have a website showing their client portfolio
- Verticals: healthcare, beauty, education, real estate (Citare's strongest verticals)
- Agency size: 5-20 people (large enough to have clients, small enough to want differentiation)

**Deliverable**: List of 20 agencies with contact info, website, estimated client count, primary verticals.

### Step 5.2: Outreach Sequence

**Week 1**: Send personalized message (LinkedIn or email) to 20 agencies with a free audit of one of their clients' websites attached. No ask, just value.

**Week 2**: Follow up with those who responded. Offer live demo. Show the audit results and what continuous monitoring would reveal.

**Week 3**: For interested agencies, set up their white-label account. Client connects Google Ads. First real data flows.

**Week 4**: Monitor results, fix any issues, share first dashboard with agency. Ask for feedback.

### Step 5.3: First Real Data Pipeline Test

When the first agency connects their client's Google Ads:

| # | Step | What to watch for |
|---|------|------------------|
| 1 | OAuth flow completes | Tokens stored, no errors |
| 2 | Data ingestion runs | All 4 Google APIs return data (or graceful empty handling) |
| 3 | Bring KG synthesis prompt here | I process it as Tier One strategist |
| 4 | KG stored in database | Verify in Supabase — services, competitors, decision radius all make sense |
| 5 | Presence generated | All 5 formats, content is accurate for this real business |
| 6 | Presence deployed | Public URLs serve correct content |
| 7 | Monitoring runs (production mode) | Real AI platform responses, real competitor names |
| 8 | Dashboard shows real data | Visibility scores reflect reality, not simulation |
| 9 | Recommendations make sense | Actionable for this specific business |
| 10 | Agency sees the dashboard | They understand the value without explanation |

### Step 5.4: Iterate Based on Feedback

Collect feedback from 2-3 pilot agencies over 2-4 weeks:
- What's confusing in the dashboard?
- What's missing from the recommendations?
- Is the ROI metric (equivalent ad spend) believable?
- Would they pay ₹5,000/client/month for this?
- What would make them upgrade from trial to paid?

Fix top 5 issues before proceeding to paid version.

---

## GTM Phase 6: Paid Launch

### Vision
Convert trial agencies to paying customers. Introduce billing. Scale to 10+ agencies.

### Step 6.1: Stripe Billing Integration

- Agency subscription: ₹10,000-15,000/month platform fee
- Per-client fee: ₹5,000/client/month (first 5), ₹4,000 (6-20), ₹3,000 (21+)
- Annual discount: 2 months free
- No setup fees

### Step 6.2: Cron Automation

- Daily monitoring runs via Vercel Cron or QStash
- Weekly strategist runs for all clients
- Monthly report auto-generation
- Token refresh checks

### Step 6.3: Scale to 10+ Agencies

- Target: 20 agencies, 100+ clients by end of Month 6
- Revenue target: ₹5-8 lakh/month
- Monitor unit economics: cost per client vs revenue per client

---

## Timeline Summary

| Phase | Duration | Milestone |
|-------|----------|-----------|
| GTM 1: Feature Enhancement | ~~1 week~~ **Steps 1.1-1.4 DONE (2026-03-24)**, Step 1.5 remaining | Citability, crawler check, brand mentions, free audit page |
| GTM 2: Production Readiness | 1 week | Production monitoring, OAuth verified, Vercel deployed, security audit |
| GTM 3: System Audit | 2-3 days | Every flow tested, every page verified |
| GTM 4: Pitch Materials | 2-3 days | One-pager, demo script ready |
| GTM 5: Agency Outreach | 4 weeks | 20 agencies contacted, 2-3 on trial, first real data |
| GTM 6: Paid Launch | 2-4 weeks after trial feedback | Stripe billing, cron automation, scale |

**First agency demo**: End of GTM Phase 3 (~2 weeks from now)
**First real client data**: GTM Phase 5, Week 3 (~4 weeks from now)
**First paying agency**: GTM Phase 6 (~8 weeks from now)

---

## Rules for Using This Document

1. Each phase has clear completion tests. Don't move to the next until tests pass.
2. GTM Phase 5 (agency outreach) is the real test — everything before it is preparation.
3. When real data breaks something (and it will), fix it immediately. Speed of response during the trial is what converts agencies.
4. Update this document with actual dates and outcomes as you progress.
5. The free audit is the hook. Never charge for audits. The value is in continuous monitoring.

---

*Build the product. Then let the product sell itself.*

— End of Document —
