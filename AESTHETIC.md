# CITARE — Aesthetic Bible & Design System
## Version 1.0 — March 2026

> **Purpose**: This document defines Citare's complete visual identity, design language, and component patterns. It is the reference for every screen, page, and UI element built for Citare — from homepage to dashboard to agency white-label templates. Claude Code and any designer should read this before creating any visual element.

---

## 1. Brand Identity & Design Philosophy

### 1.1 The Vibe

**Technical intelligence, made visible.**

Citare's aesthetic should feel like looking at a command center for AI search — sophisticated, data-rich, and quietly powerful. Think of it as the interface a senior strategist would use: everything is where it should be, nothing is decorative without purpose, and the data tells the story.

The closest references in the market: Railway.app's spatial intelligence and dark canvas, Linear's precision and restraint, Vercel's confidence and typographic clarity. Citare takes the best of each — Railway's depth and atmosphere, Linear's functional elegance, Vercel's bold type hierarchy — and adds its own personality: the warmth of intelligence in action, data flowing through a living system.

### 1.2 Design Principles

| Principle | Meaning |
|-----------|---------|
| **Intelligence over decoration** | Every visual element communicates data or hierarchy. No ornamental gradients, no stock illustrations, no decorative blobs. If it doesn't inform, it doesn't belong. |
| **Dark canvas, bright signals** | The dark background is the canvas. Data, scores, status indicators, and key actions are the bright signals that draw attention. The eye goes where the light is. |
| **Breathing room** | Generous whitespace (darkspace, technically). Elements never feel crowded. The space between things matters as much as the things themselves. Let the interface breathe. |
| **Motion with purpose** | Subtle animations signal state changes, data loading, and system activity. The system should feel alive — like a nervous system pulsing — but never distracting. No bounce effects, no spinning loaders, no confetti. |
| **Progressive disclosure** | Show the essential first. Details reveal on interaction. Drill-down, don't overwhelm. The agency sees client health at a glance; they drill into specifics only when needed. |

### 1.3 What Citare Should NEVER Look Like

- Generic SaaS dashboards with white backgrounds and blue buttons (every Tailwind template ever)
- Overly playful or startup-y (no emoji in the UI, no rounded bubbly shapes, no pastel palettes)
- Enterprise-heavy with dense tables and tiny gray text (not Oracle)
- Marketing-heavy with stock photos of smiling people pointing at screens
- Glassmorphism, neumorphism, or any trend-of-the-year aesthetic that will date immediately

---

## 2. Color System

### 2.1 Core Palette

The palette is built on a deep navy/charcoal base with a signature accent. Not pure black — pure black feels dead on screens. The base has a subtle blue undertone that gives depth and makes elements feel like they're floating in space.

```css
:root {
  /* ── Base (Dark Canvas) ── */
  --bg-primary: #0A0B0F;          /* Deepest background — page level */
  --bg-secondary: #12131A;        /* Card/panel backgrounds */
  --bg-tertiary: #1A1B26;         /* Elevated surfaces (modals, popovers) */
  --bg-hover: #1F2133;            /* Hover states on dark surfaces */
  --bg-active: #252740;           /* Active/selected states */
  
  /* ── Borders & Dividers ── */
  --border-subtle: #1E2030;       /* Barely visible structure lines */
  --border-default: #2A2D42;      /* Standard borders */
  --border-strong: #3D4166;       /* Emphasized borders */
  
  /* ── Text ── */
  --text-primary: #E8E9ED;        /* Primary text — high contrast but not pure white */
  --text-secondary: #9496A8;      /* Secondary text, labels, descriptions */
  --text-tertiary: #5E6078;       /* Disabled text, placeholders, timestamps */
  --text-inverse: #0A0B0F;        /* Text on light/accent backgrounds */
  
  /* ── Signature Accent: Electric Teal ── */
  --accent-primary: #00D4AA;      /* Primary action color — buttons, links, key metrics */
  --accent-hover: #00E8BC;        /* Accent hover state */
  --accent-muted: #00D4AA1A;      /* Accent at 10% opacity — subtle highlights */
  --accent-glow: #00D4AA33;       /* Accent at 20% — glow effects */
  
  /* ── Status Colors ── */
  --status-green: #34D399;        /* Healthy, positive, growth */
  --status-yellow: #FBBF24;       /* Warning, attention needed */
  --status-red: #F87171;          /* Error, critical, decline */
  --status-blue: #60A5FA;         /* Informational, neutral */
  
  /* ── Visibility Score Gradient ── */
  --score-low: #F87171;           /* 0-30: Red — poor visibility */
  --score-mid: #FBBF24;           /* 31-60: Yellow — moderate */
  --score-high: #34D399;          /* 61-80: Green — good */
  --score-excellent: #00D4AA;     /* 81-100: Teal — excellent (matches accent) */
  
  /* ── Platform Colors (for monitoring charts) ── */
  --platform-chatgpt: #10A37F;    /* OpenAI green */
  --platform-perplexity: #20808D; /* Perplexity teal */
  --platform-google: #4285F4;     /* Google blue */
  --platform-gemini: #8E75B2;     /* Gemini purple */
  --platform-claude: #D4A574;     /* Claude warm brown/gold */
  
  /* ── Surfaces ── */
  --glass: rgba(255, 255, 255, 0.03);  /* Ultra-subtle glass effect */
  --glass-border: rgba(255, 255, 255, 0.06);
}
```

### 2.2 Color Usage Rules

- **Accent teal (#00D4AA) is reserved for**: Primary CTAs, key metrics, visibility scores at the top range, links, active navigation items, and the Citare wordmark glow. It should never be used for backgrounds or large surface areas. It's the signal, not the noise.
- **Status colors are contextual only**: Green means growth/healthy, yellow means attention, red means problem. Never use status colors for decoration.
- **Text never sits directly on --bg-primary without a card**: Body content always sits on --bg-secondary or --bg-tertiary cards. This creates layering depth.
- **Borders are structural, not decorative**: Use --border-subtle for most dividers. --border-default only when distinction between areas matters. --border-strong rarely — for emphasizing active/selected states.

### 2.3 Agency White-Label Considerations

The white-label version allows agencies to customize:
- Their logo (replaces Citare logo)
- A single accent color (replaces --accent-primary and its variants)
- Agency name in the header

The base dark palette, typography, and layout structure remain fixed. This ensures the product looks professional regardless of what accent color the agency chooses. Generate accessible contrast ratios for any custom accent against the dark base.

---

## 3. Typography

### 3.1 Type System

Two fonts. No more. Restraint is the point.

```css
:root {
  /* ── Display / Headings ── */
  --font-display: 'Geist', 'SF Pro Display', -apple-system, sans-serif;
  
  /* ── Body / UI ── */
  --font-body: 'Geist Mono', 'JetBrains Mono', 'SF Mono', monospace;
  /* Mono for data-heavy contexts: scores, metrics, tables, code */
  
  /* Alternative if Geist is unavailable: */
  /* --font-display: 'Plus Jakarta Sans', sans-serif; */
  /* --font-body: 'IBM Plex Mono', monospace; */
}
```

**Why Geist**: It's Vercel's typeface, open source, designed for technical interfaces, excellent at small sizes, and has a mono variant that pairs perfectly. It signals "we're a technical product" without being cold.

**Why monospace for data**: Scores, percentages, rupee amounts, and metrics should always be in mono. Numbers in proportional fonts jitter when they change — 88% and 100% take different widths. Mono keeps data columns aligned and makes dashboards feel precise.

### 3.2 Type Scale

```css
/* ── Scale (rem-based, 1rem = 16px) ── */
--text-xs: 0.75rem;      /* 12px — timestamps, captions, tertiary info */
--text-sm: 0.8125rem;    /* 13px — table data, secondary labels */
--text-base: 0.875rem;   /* 14px — body text, descriptions (NOT 16px — denser is better for dashboards) */
--text-md: 1rem;          /* 16px — prominent body, card titles */
--text-lg: 1.25rem;       /* 20px — section headers */
--text-xl: 1.5rem;        /* 24px — page titles */
--text-2xl: 2rem;         /* 32px — hero/feature headers */
--text-3xl: 2.5rem;       /* 40px — homepage hero only */
--text-4xl: 3.5rem;       /* 56px — homepage main headline only */

/* ── Line Heights ── */
--leading-tight: 1.2;     /* Headings */
--leading-normal: 1.5;    /* Body text */
--leading-relaxed: 1.7;   /* Long-form (reports, descriptions) */

/* ── Font Weights ── */
--weight-normal: 400;
--weight-medium: 500;     /* Most UI labels */
--weight-semibold: 600;   /* Emphasis, active states */
--weight-bold: 700;       /* Headings, key metrics */
```

### 3.3 Typography Rules

- Dashboard base font size is 14px (--text-base), not 16px. Denser interfaces read better at smaller sizes with proper spacing.
- All numbers and metrics use --font-body (mono). Always.
- Headings use --font-display with --weight-semibold or --weight-bold.
- Never use more than 3 font sizes on a single screen. Pick from the scale.
- Letter-spacing: -0.01em on headings (slightly tighter), 0.02em on mono text (slightly looser for readability).
- Hindi and Hinglish text falls back to system fonts (Noto Sans Devanagari) — ensure the type stack includes this for Indian language support.

---

## 4. Component Patterns

### 4.1 Cards

The card is the primary container in Citare. Everything is a card.

```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 20px 24px;
  transition: border-color 0.2s ease;
}

.card:hover {
  border-color: var(--border-default);
}

.card-elevated {
  background: var(--bg-tertiary);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}
```

- Cards have 12px radius — not too rounded (playful), not too sharp (corporate). Just enough to feel modern.
- 1px borders in --border-subtle — barely visible, they define structure without screaming.
- Hover gently reveals the border. No scale transforms. No shadow changes. Subtle is the word.

### 4.2 Buttons

```css
/* Primary — accent color, used sparingly */
.btn-primary {
  background: var(--accent-primary);
  color: var(--text-inverse);
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: var(--text-sm);
  transition: background 0.15s ease;
}

.btn-primary:hover {
  background: var(--accent-hover);
}

/* Secondary — outline style, most common */
.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: var(--text-sm);
  transition: all 0.15s ease;
}

.btn-secondary:hover {
  background: var(--bg-hover);
  border-color: var(--border-strong);
}

/* Ghost — text only, for tertiary actions */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: var(--text-sm);
}

.btn-ghost:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}
```

- Primary buttons are used once per screen, maximum. The eye should know exactly where the primary action is.
- Most buttons are secondary (outline) or ghost.
- Button text is 13px (--text-sm), not the default 16px. Dashboard buttons should be compact.

### 4.3 Status Indicators

```css
/* Dot indicators for health status */
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot--green {
  background: var(--status-green);
  box-shadow: 0 0 8px var(--status-green);  /* subtle glow */
}

.status-dot--yellow {
  background: var(--status-yellow);
  box-shadow: 0 0 8px var(--status-yellow);
}

.status-dot--red {
  background: var(--status-red);
  box-shadow: 0 0 8px var(--status-red);
  animation: pulse-red 2s ease-in-out infinite;
}

@keyframes pulse-red {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```

- Green dots glow faintly — the system is alive and healthy.
- Red dots pulse slowly — something needs attention. This is the only animation that should feel urgent.
- Yellow dots are static glow — attention, but not alarm.

### 4.4 Visibility Score Display

The visibility score is Citare's signature visual element. It should feel like a vital sign.

```css
/* Score ring — circular progress indicator */
.score-ring {
  width: 120px;
  height: 120px;
  position: relative;
}

/* Score number inside the ring */
.score-value {
  font-family: var(--font-body);  /* mono */
  font-size: var(--text-2xl);
  font-weight: var(--weight-bold);
  /* Color dynamically set based on score range */
}

/* The ring stroke color follows the score gradient:
   0-30: --score-low (red)
   31-60: --score-mid (yellow) 
   61-80: --score-high (green)
   81-100: --score-excellent (teal) */
```

- Score rings appear on client overview cards, the competitive comparison view, and service/product drill-downs.
- The number inside is always mono, always bold. It's the most important number on the screen.
- A subtle glow effect behind the ring when score is 80+ (matches the accent glow).

### 4.5 Charts & Data Visualization

```
Chart Library: Recharts (React) — lightweight, composable, works well with Tailwind.

Chart Rules:
- Background: transparent (sits on card background)
- Grid lines: var(--border-subtle) — barely visible
- Axis text: var(--text-tertiary), var(--text-xs), mono
- Data lines: 2px stroke weight
- Area fills: 5-10% opacity of the line color
- Tooltips: var(--bg-tertiary) background, subtle border, no arrow
- Legend: integrated into the chart title, not a separate block
- Maximum 5 data series per chart (readability)

Platform colors are used consistently:
- ChatGPT line is always --platform-chatgpt
- Perplexity is always --platform-perplexity
- And so on. Users learn to recognize platforms by color.
```

### 4.6 Navigation

```
Sidebar Navigation (Dashboard):
- Width: 240px collapsed to 64px (icon only)
- Background: var(--bg-primary) — flush with page
- Active item: var(--bg-active) background + left accent bar (2px, --accent-primary)
- Hover: var(--bg-hover) background
- Icons: 20px, --text-secondary, becoming --text-primary on active
- Section dividers: var(--border-subtle), with 8px padding above/below
- Logo at top: Citare wordmark or agency logo (white-label)

Top Bar (Homepage/Marketing):
- Transparent on hero, transitioning to var(--bg-primary) on scroll
- Sticky on scroll with a subtle backdrop blur
- Navigation links: --text-secondary, --text-primary on hover
- CTA button: --accent-primary (only button in the nav)
```

---

## 5. Homepage Structure

### 5.1 Page Flow (Top to Bottom)

The homepage is a single scrollable page with distinct sections. Each section has a purpose and a visual signature.

**Section 1: Hero**
- Full-viewport dark background with a subtle animated gradient (deep navy → deep charcoal, slow rotation)
- Main headline: Large (--text-4xl), --font-display, --weight-bold. White text. One line.
  - "Your clients are invisible in AI search."
  - Or: "Make businesses visible in AI search."
- Sub-headline: --text-lg, --text-secondary. Two lines max.
  - "ChatGPT, Perplexity, and Gemini recommend your competitors. Citare changes that."
- Primary CTA: "See it in action →" (scrolls to demo section) + secondary "Start free pilot"
- No stock images. No illustrations. The typography IS the hero.
- Below the fold hint: a subtle animated chevron or the beginning of the next section peeking in.

**Section 2: The Problem (Visual Demo)**
- Split screen or side-by-side comparison. This is the "show, don't tell" section.
- LEFT: "Without Citare" — a simulated AI search query (e.g., "best dermatologist in Pune") showing results that don't include the client. Grayed out, muted.
- RIGHT: "With Citare" — the same query, now showing the client appearing with rich information. Bright, accent-highlighted.
- This can be an animated transition or interactive toggle.
- Below: brief text explaining the three layers: "Connect → Optimize → Monitor" with small icons.
- No long paragraphs. The visual does the talking.

**Section 3: How It Works (Three Steps)**
- Horizontal flow of three cards or vertical scroll.
- Step 1: "Connect your Google Ads" — icon of OAuth/connection, brief text. "One click. We pull everything from your existing ad campaigns — keywords, spend, locations, competitors."
- Step 2: "AI builds your presence" — icon of structured data/network. "Our AI creates optimized profiles across 5 formats in multiple languages. Deployed automatically."
- Step 3: "Monitor & prove ROI" — icon of chart/dashboard. "Daily tracking across 5 AI platforms. See exactly where you show up and where competitors don't."
- Each step card has a subtle connecting line or animation between them.

**Section 4: The Dashboard (Product Screenshot/Demo)**
- A large, clean screenshot or interactive preview of the actual Citare dashboard.
- Show the overview screen with a visibility score, competitive comparison, and platform breakdown.
- This should look polished enough that an agency thinks "I want my clients to see this."
- Optionally: an embedded interactive demo (limited version) where visitors can click through tabs.
- Caption: "This is what your agency dashboard looks like. White-labeled under your brand."

**Section 5: Agency Value Proposition**
- Directly addresses agencies: "Built for agencies. White-labeled. Incremental revenue."
- Three value points: "New revenue stream," "No additional work," "Your brand, your clients."
- Visual of agency.yourbrand.citare.ai with a customizable accent color mockup.
- The math: "Your client pays ₹20,000/month. Your cost: ₹3,500. Pure margin."

**Section 6: Key Differentiators**
- Grid of 4-6 features that separate Citare from anything else:
  - "Google Ads as your secret weapon" (auto-onboarding)
  - "Hinglish & 8 Indian languages" (nobody else does this)
  - "Landmark-based location intelligence" (Indian addressing)
  - "Contextual decision radius" (LASIK ≠ pharmacy)
  - "AI Search Impact Score" (attribution nobody else has)
  - "Self-improving system" (Layer 4 meta-intelligence)
- Each feature: icon, title, one-line description. No essays.

**Section 7: Social Proof**
- Testimonials from pilot agencies (when available).
- Before launch: "Built by practitioners who manage ₹X crore in Google Ads annually" or similar credibility signal.
- Logos of platforms supported: Google Ads, ChatGPT, Perplexity, Gemini, Claude, Shopify logos.
- Not fake testimonials. If you don't have them yet, skip this section until you do.

**Section 8: Pricing**
- Clean and transparent. Three cards: Physical Business, E-Commerce, Agency White-Label.
- Each shows monthly price, what's included, and a CTA.
- Agency card is highlighted (primary accent border) as the "recommended" path.
- "No setup fees. Cancel anytime. 2 months free on annual billing."

**Section 9: Footer CTA**
- Final push: "Your competitors are already being recommended by AI. Are you?"
- Email capture or "Book a demo" button.
- Standard footer: links, legal, social.

### 5.2 Homepage Interactions & Motion

- **Scroll-triggered reveals**: Sections fade in and translate up slightly (8-12px) as they enter viewport. Not dramatic — just enough to feel alive.
- **The hero gradient**: Slow (20-30 second cycle), subtle color shift in the background. Almost imperceptible but adds life.
- **The demo comparison**: Either an auto-playing loop (before/after every 4 seconds) or a user-controlled toggle/slider.
- **Numbers that count up**: When the pricing section enters viewport, the monthly prices count up from 0. Quick (0.5 seconds). Only happens once.
- **No parallax scrolling**. No scroll-jacking. No horizontal scroll sections. These frustrate users.

---

## 6. Dashboard Layout

### 6.1 Overall Structure

```
┌──────────────────────────────────────────────────────────┐
│  Logo/Brand    │    Page Title          │   User Menu     │
├────────────────┤─────────────────────────────────────────│
│                │                                          │
│   Navigation   │    Main Content Area                     │
│   Sidebar      │                                          │
│                │    ┌─────────┐  ┌─────────┐              │
│   Overview     │    │ Score   │  │ Trend   │              │
│   Services     │    │ Card    │  │ Chart   │              │
│   Products     │    └─────────┘  └─────────┘              │
│   Competitors  │                                          │
│   Monitoring   │    ┌─────────────────────┐               │
│   Reports      │    │ Detailed Data Table │               │
│   Settings     │    │                     │               │
│                │    └─────────────────────┘               │
│   ─────────    │                                          │
│   Admin        │    ┌─────────────────────┐               │
│   (if super)   │    │ Recommendations     │               │
│                │    └─────────────────────┘               │
└────────────────┴──────────────────────────────────────────┘
```

- Sidebar: 240px on desktop, collapsible to 64px (icon-only), hidden on mobile with hamburger toggle.
- Main content: fluid width, max-width 1400px, centered with padding.
- Content area uses a grid system: 12-column on desktop, stacking on mobile.
- Cards are the primary content container. No floating elements.

### 6.2 Dashboard-Specific Components

**Client Selector** (Agency View):
- Dropdown in the top bar showing current client.
- Search/filter for agencies with many clients.
- Shows client name + health status dot (green/yellow/red).
- Quick switch without page reload.

**Metric Cards** (Top of Overview):
- Row of 3-4 cards showing key numbers: Visibility Score, Total Queries Monitored, Competitors Tracked, AI Search Value (₹).
- Each card: label (--text-secondary, --text-xs), value (--font-body mono, --text-xl, --weight-bold), trend indicator (↑ green or ↓ red with percentage change).

**Platform Breakdown Bar**:
- Horizontal segmented bar showing visibility per platform.
- Each segment colored by platform color (--platform-chatgpt, etc.).
- Hover reveals exact percentage.
- Below the bar: small platform icons with individual scores.

**Competitive Race Chart**:
- For each focus service/product, a horizontal bar chart showing:
  - Client position (accent-highlighted)
  - Competitor positions (--text-tertiary)
  - Bar length represents visibility score
  - Sorted by score descending
- This is the "am I winning?" view.

**Recommendation Cards**:
- Priority-colored left border (red/yellow/blue).
- Title + one-line description.
- "Approve" button (primary) and "Dismiss" (ghost).
- Approved recommendations show a checkmark and timestamp.

### 6.3 Super Admin Console Aesthetic

Same design system but with a distinct visual marker — a thin orange/amber top-bar or border that signals "you are in admin mode." This prevents accidentally confusing admin view with client view.

Admin-specific components:
- **Health Grid**: Grid of service cards, each with status dot, response time, last checked timestamp.
- **Cost Table**: Per-client cost breakdown with sparkline trends. Sortable columns. Row highlighting for outliers.
- **Usage Gauges**: Circular or linear progress bars showing infrastructure usage against tier limits. Color shifts from green → yellow → red as limits approach.
- **Failover Toggles**: Toggle switches with clear "Primary" and "Backup" labels. Currently active method highlighted.

---

## 7. Motion & Animation

### 7.1 Timing Standards

```css
:root {
  --transition-fast: 0.1s ease;      /* Hover states, toggles */
  --transition-normal: 0.2s ease;    /* Most UI transitions */
  --transition-slow: 0.3s ease;      /* Page transitions, reveals */
  --transition-data: 0.6s ease-out;  /* Chart animations, score changes */
}
```

### 7.2 Animation Principles

- **Enter**: Elements fade in + translate up 8px. Stagger children by 50ms.
- **Exit**: Fade out. No translate. Exits should be faster than entries.
- **Data updates**: Numbers morph (count up/down). Charts transition between states.
- **Loading**: Skeleton screens (pulsing --bg-hover rectangles matching content shapes), never spinners.
- **System activity**: In the admin console, a subtle "heartbeat" pulse on the health monitoring section — shows the system is alive and checking.
- **Never**: Bounce, spring physics, 3D transforms, page transitions that block interaction, loading spinners.

---

## 8. Responsive Strategy

### Breakpoints

```css
/* Mobile first, then expand */
--bp-sm: 640px;    /* Small tablets */
--bp-md: 768px;    /* Tablets */
--bp-lg: 1024px;   /* Small desktop */
--bp-xl: 1280px;   /* Standard desktop */
--bp-2xl: 1536px;  /* Large monitors */
```

### Key Responsive Decisions

- **Sidebar**: Visible on lg+. Hidden on mobile/tablet with hamburger menu.
- **Metric cards**: 4-column on xl+, 2-column on md+, stacked on mobile.
- **Charts**: Full-width always. Simplify on mobile (fewer data points, hide legend, tap-to-inspect).
- **Tables**: Horizontal scroll on mobile with frozen first column.
- **Homepage**: Single-column on mobile. Hero text scales down to --text-2xl. Demo section stacks vertically.
- **Score rings**: Scale from 120px (desktop) to 80px (mobile).

---

## 9. Iconography

- **Icon set**: Lucide React (consistent with shadcn/ui, open source, well-maintained).
- **Icon size**: 20px for navigation, 16px inline with text, 24px for feature cards.
- **Icon color**: --text-secondary default, --text-primary on active/hover, --accent-primary for key actions.
- **Custom icons**: Platform logos (ChatGPT, Perplexity, Google, Gemini, Claude) are custom SVGs, not from an icon set. Keep these minimal and monochrome within the UI, full-color only in marketing contexts.
- **No emoji in the product UI.** Ever. Emoji undermines the technical intelligence positioning.

---

## 10. The Citare Wordmark

The Citare name in the UI and on the homepage uses the --font-display at --weight-bold with a subtle letter-spacing of 0.05em. All uppercase: **CITARE**. The dot over the 'i' can optionally be rendered in --accent-primary as a small brand touch.

No logomark/icon at launch. The wordmark is the logo. This keeps it clean, typographic, and avoids the "generic tech logo" trap. A logomark can be designed later when brand personality has stabilized through use.

For the white-label version, the Citare wordmark is hidden and replaced by the agency's logo. The "Powered by Citare" text in --text-tertiary at the bottom of the sidebar is the only mention — small, unobtrusive, functional.

---

## 11. Implementation Notes for Claude Code

When building any Citare UI:

1. **Always import CSS variables from the design system.** Never hardcode colors or font sizes.
2. **Use shadcn/ui as the base component library** but override with Citare's design tokens. shadcn provides structure; Citare's tokens provide identity.
3. **Tailwind config extends** (doesn't replace) with Citare's colors and typography.
4. **Dark mode only.** No light mode toggle needed. The entire Tailwind config assumes dark.
5. **Test on the developer's machine resolution** (1920x1080 likely, given the Dell). Also test 1366x768 (common Indian laptop resolution) and mobile.
6. **Hindi/Hinglish text** should be tested for overflow — Devanagari script is wider than Latin. Allow for 30% text expansion.
7. **Every dashboard screen has a max-width of 1400px** centered, with 24px padding on each side.
8. **Loading states use skeleton screens**, never spinners. Match the skeleton shapes to the expected content layout.
9. **All charts use Recharts** with the specified theming. No chart.js, no d3 unless Recharts can't handle the visualization.
10. **Framer Motion** (or React Motion) for page transitions and component animations. CSS transitions for hover/active states.

---

*This document is the visual source of truth. When in doubt about any visual decision, refer here first. Consistency is the foundation of perceived quality.*

— End of Document —
