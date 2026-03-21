# MegalodonMD PRD

## Pharmaceutical Price Intelligence Platform

### LotusHack 2026 | Enterprise Track (TinyFish)

---

## 1. Problem Statement

Vietnam has no unified pharmaceutical pricing infrastructure. The same medication can vary 100-300% in price across pharmacy chains, hospital pharmacies, and independent outlets. With 57,000+ pharmacies nationwide and only ~5.7% market share held by modern chains, pricing is fragmented and opaque.

**Who feels this pain at the enterprise level:**

- **Hospital procurement departments** (1,192 public hospitals) sourcing medications for hundreds to thousands of beds
- **Clinic chain purchasing managers** running 20-100+ locations who need centralized sourcing intelligence
- **Health insurance formulary analysts** building cost models across regions
- **Pharmaceutical distributors** tracking competitor retail pricing across chains in real time

Vietnam's pharmaceutical market is valued at ~$7-10B+ and growing 15%+ annually. Drug prices in Vietnam have been documented at up to 47x international reference prices for branded products.

**Why this is unsolvable without TinyFish:**

- Long Chau (2,117+ stores), Pharmacity (957+ stores), An Khang (527+ stores) all operate independent e-commerce websites with searchable drug catalogs
- None expose public APIs
- Prices change frequently (promotions, stock fluctuations, regional pricing)
- The only way to get fresh, structured pricing data is to navigate these sites in real time -- exactly what TinyFish does

---

## 2. Product Vision

**MegalodonMD** is an AI-powered pharmaceutical price intelligence platform that deploys parallel TinyFish web agents across Vietnamese pharmacy chain websites simultaneously, returning unified, structured drug pricing data in real time.

**One-liner:** "We turn every pharmacy website in Vietnam into a queryable, real-time pricing API using parallel AI web agents."

---

## 3. Target Pharmacy Sources

### Tier 1: Must-have for demo (5 sources)

| # | Chain | URL | Store Count |
|---|-------|-----|-------------|
| 1 | FPT Long Chau | nhathuoclongchau.com.vn | 2,117+ |
| 2 | Pharmacity | pharmacity.vn | 957+ |
| 3 | An Khang | ankhang.vn | 527+ |
| 4 | Nha Thuoc Than Thien | nhathuocthanhtien.vn | 100+ |
| 5 | Medicare Vietnam | medicare.vn | 50+ |

### Tier 2: Stretch goals

| # | Chain | URL |
|---|-------|-----|
| 6 | Phano Pharmacy | phano.vn |
| 7 | ECO Pharmacy | ecopharma.com.vn |
| 8 | Trung Son Pharma | trungtamthuoc.com |

---

## 4. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    REACT DASHBOARD                       │
│  Drug search → Price comparison grid → Trend charts     │
│  Agent activity feed → Live metrics → Agent cascade     │
│  Voice input → Prescription OCR            │
└───────────────────────┬─────────────────────────────────┘
                        │ REST API + SSE
┌───────────────────────┴─────────────────────────────────┐
│                   FASTAPI BACKEND                        │
│                                                         │
│  POST /api/search      - parallel price search (SSE)    │
│  POST /api/optimize    - batch prescription optimizer    │
│  GET  /api/prices      - cached results                 │
│  GET  /api/trends      - historical price data          │
│  POST /api/alerts      - price alerts                   │
│  POST /api/monitor     - recurring monitor              │
│  POST /api/demo-alert  - Discord + ElevenLabs demo      │
│  POST /api/ocr         - prescription image extraction  │
│  GET  /api/memory/recall - Supermemory context recall    │
└──┬──────────┬──────────┬──────────┬─────────────────────┘
   │          │          │          │
   ▼          ▼          ▼          ▼
┌──────┐ ┌──────┐ ┌──────┐ ┌──────────────┐
│TinyF.│ │TinyF.│ │TinyF.│ │  APScheduler │
│Agent │ │Agent │ │Agent │ │  (cron jobs)  │
│Long  │ │Pharm │ │An    │ │  15-min cycle │
│Chau  │ │acity │ │Khang │ │              │
│stlth │ │stlth │ │stlth │ │              │
└──┬───┘ └──┬───┘ └──┬───┘ └──────┬───────┘
   │        │        │             │
   │  Tier 2: Exa variant discovery│
   │  Tier 3: Scout-spawn re-search│
   ▼        ▼        ▼             ▼
┌─────────────────────────────────────────────────────────┐
│                   SQLite DATABASE                        │
│  drugs | prices | sources | alerts | monitor_jobs       │
│  gov_prices (DAV ceiling data)                          │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              INTELLIGENCE LAYER                          │
│  Exa API        →  drug variants, WHO pricing, info     │
│  OpenRouter     →  Qwen normalization, GPT-4o OCR       │
│  Supermemory    →  search context recall                │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              NOTIFICATION LAYER                          │
│  Discord Webhooks  →  procurement team alerts            │
│  ElevenLabs TTS    →  Vietnamese voice summary          │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Core User Flows

### Flow 1: On-Demand Price Search (Primary Demo)
1. Procurement manager types drug name (e.g., "Metformin 500mg") or uses **voice input** (Web Speech API)
2. **Qwen 2.5 72B normalizes** the query (handles typos, Vietnamese diacritics)
3. Backend dispatches 5 TinyFish agents simultaneously (Tier 1)
4. Results stream back via SSE. **Pharmacy cards light up** as each responds.
5. **Agent Activity Feed** shows real-time log of all agent events (spawn, searching, complete, error)
6. **Live Metrics Bar** ticks up: agents deployed, pharmacies scanned, products found, savings
7. **Tier 2: Exa variant discovery** finds generic alternatives (e.g., Metformin → Glucophage, Metformin Stada)
8. **Tier 3: Scout-spawn** dispatches new TinyFish agents for each discovered variant
9. Dashboard displays unified **PriceGrid** with sorting, source colors, variant badges
10. **SavingsBanner** shows concrete savings: "Save ₫340,000 (47%)"
11. **Government Ceiling Panel** checks results against DAV declared prices, flags violations
12. **WHO reference pricing** and **drug info cards** enrich results via Exa

### Flow 2: Persistent Price Monitoring
1. Set up monitor: "Track Metformin 500mg every 15 minutes"
2. APScheduler triggers TinyFish agents on interval
3. Price observations stored in SQLite with timestamps
4. Discord alert + ElevenLabs Vietnamese voice when price drops

### Flow 3: Prescription Cost Optimizer
1. Input full prescription (multiple drugs) or upload prescription image (OCR extraction via GPT-4o function calling)
2. Backend submits ALL drug x pharmacy combinations via TinyFish `/run-batch` endpoint (single atomic POST, up to 100 runs)
3. Polls all run results in parallel, validates each result (COMPLETED != success)
4. Returns optimized sourcing plan showing cheapest source per drug with total savings vs single-source

---

## 5b. TinyFish Integration Details

### Browser Profile
All agents use `browser_profile: "stealth"` (anti-detection fingerprinting) to prevent bot blocking on protected sites like Long Chau (FPT-owned). BrightData proxy additionally applied to Long Chau, Pharmacity, and An Khang.

### Production Goal Prompts
Each pharmacy has a tailored goal prompt with:
- Numbered steps for deterministic execution (4.9x faster than generic goals)
- Cookie/popup dismissal as Step 1
- CAPTCHA detection → structured error return `{"error": "CAPTCHA_DETECTED"}`
- Exact JSON schema with example output
- Vietnamese-specific edge cases: "Het hang" → `in_stock: false`, "Lien he" → `price: null`
- Visual descriptions (not CSS selectors) for resilience against site redesigns

### Result Validation
`COMPLETED` status means the browser session ended, NOT that data was extracted. Every result is validated:
- Infrastructure failure (`FAILED` status) → error with message
- Goal failure (CAPTCHA detected, extraction failed) → structured error
- Partial results → logged with context for debugging

### Live Browser Preview
Every TinyFish run emits a `STREAMING_URL` — an iframe-embeddable live view of the browser navigating. The frontend shows these in a collapsible panel during search, allowing judges to watch real-time pharmacy scraping.

### Batch Endpoint
The prescription optimizer uses `/run-batch` to submit all drug x pharmacy combinations atomically (e.g., 5 drugs x 5 pharmacies = 25 runs in one POST). Individual SSE streaming is preserved for the primary single-drug search flow.

---

## 6. Multi-Tier Agent Pipeline

The search system uses a 5-tier agent cascade, visualized in real-time via the **Agent Cascade Pipeline** component:

### Tier 0: OCR Extract (optional)
- Triggered by prescription image upload
- GPT-4o vision extracts structured drug list
- Tracked via **Model Router Panel** as "OCR → gpt-4o"

### Tier 1: Pharmacy Search (5 parallel agents)
- 5 TinyFish agents dispatched simultaneously
- Each navigates a pharmacy website, extracts product cards
- Results stream back via SSE with latency tracking
- Tracked as "Search → TinyFish Agent"

### Tier 2: Variant Discovery
- As Tier 1 agents complete, Exa semantic search discovers generic alternatives
- Query: `"{drug_name} generic alternative brand names Vietnam pharmacy"`
- Uses `includeText` filter on active ingredient for precision
- Tracked as "Discovery → Exa Neural"

### Tier 3: Scout-Spawn Re-search
- Top 3 discovered variants are re-searched across successful pharmacies
- Results tagged as `is_variant_result: true` with `variant_of` label
- This is the dynamic agent spawning from runtime discoveries that makes TinyFish irreplaceable

### Tier 4: Analyst Verdict (cross-validation + actionable labels)
- Spawned after summary is built — cross-validates all prior tier results
- **Confidence scoring engine** computes a 0-100 score from 5 weighted signals:
  - Source agreement (30%): How many pharmacies returned results
  - Price convergence (20%): Low coefficient of variation = high confidence
  - Compliance clear (15%): Government ceiling alignment
  - Anomaly free (20%): Absence of counterfeit flags
  - Variant coverage (15%): Exa discovered alternative drugs
- **LLM analyst** (Qwen 2.5 72B via OpenRouter) generates actionable Vietnamese verdict:
  - `action_label`: Vietnamese imperative directive (e.g., "Mua tại Long Châu. Giá tốt nhất, đáng tin cậy.")
  - `risk_level`: safe / caution / warning / danger
  - `reasoning`: 2-3 sentence English explanation
  - `buy_recommendation`: boolean
- **Rule-based fallback** if LLM fails — deterministic labels based on confidence score + anomaly/compliance flags
- Tracked as "Analyst → Qwen 2.5 72B" in Model Router Panel
- Streamed as late SSE event `analyst_verdict` — frontend shows `ActionLabel` component above SavingsBanner

### Tier 5: Investigation Swarm (auto-triggered)
- Activated when `detect_price_anomaly()` flags suspiciously low-priced products
- Spawns one `AgentTier.INVESTIGATOR` agent per anomalous product (capped at 5)
- Each investigator runs 3 parallel checks:
  1. **Counterfeit risk research** via Exa Research API (`research_counterfeit_risk()`)
  2. **WHO reference price comparison** via Exa semantic search (`search_who_reference_price()`)
  3. **Manufacturer verification** against `KNOWN_GOOD_MANUFACTURERS` set (20 major Vietnamese + international pharma companies)
- Results streamed as `anomaly_investigation` SSE events with per-product findings
- Agents resolved via `asyncio.wait(FIRST_COMPLETED)` — results appear in real-time as each investigation completes
- Frontend renders findings in `CounterfeitRiskPanel` with VERIFIED/UNVERIFIED manufacturer badges and risk levels

### Enrichment (parallel, non-blocking)
- **WHO reference pricing**: Exa `category: "research paper"` search for international benchmarks
- **Drug info cards**: Exa `summary: true` for indications, side effects, dosage
- **Government compliance**: Cross-reference against DAV ceiling prices (5 drugs seeded)

---

## 7. Tech Stack

| Layer | Technology | Sponsor |
|-------|-----------|---------|
| Web Agent | TinyFish API (AsyncTinyFish) | TinyFish |
| Proxy | BrightData (Long Chau, Pharmacity, An Khang) | BrightData |
| Backend | FastAPI (Python) | — |
| Database | SQLite (WAL mode) | — |
| Scheduler | APScheduler | — |
| Frontend | Next.js 16, React 19, Tailwind CSS v4, Recharts | — |
| UI Components | shadcn/ui (Badge, Alert, Collapsible, Accordion) + custom animated components | — |
| Icons | Lucide React | — |
| Drug Intelligence | Exa API (variants, WHO pricing, drug info) | Exa |
| LLM Routing | OpenRouter (Qwen 2.5 72B, GPT-4o) | OpenRouter |
| Normalization | Qwen 2.5 72B via OpenRouter | Qwen |
| OCR | GPT-4o via OpenRouter | OpenAI |
| Notifications | Discord Webhooks | Discord |
| Voice Alerts | ElevenLabs TTS (Vietnamese) | ElevenLabs |
| Voice Input | Web Speech API (browser-native) | — |
| Memory | Supermemory (search context recall) | Supermemory |

---

## 8. API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/search` | Trigger parallel price search (SSE stream with agent events, model tracking, compliance) |
| POST | `/api/optimize` | Prescription cost optimizer (uses /run-batch for atomic multi-drug search) |
| POST | `/api/optimize/prescription` | OCR prescription image → extract drugs → optimize (GPT-4o function calling) |
| GET | `/api/prices/{drug_query}` | Get cached results |
| GET | `/api/trends/{drug_query}` | Historical price data |
| POST | `/api/alerts` | Configure price alerts |
| GET | `/api/alerts` | List active alerts |
| DELETE | `/api/alerts/{id}` | Deactivate an alert |
| POST | `/api/monitor` | Set up recurring monitor |
| GET | `/api/monitors` | List active monitors |
| POST | `/api/ocr` | OCR prescription image → extract drug names |
| POST | `/api/demo-alert` | Trigger demo Discord + ElevenLabs voice alert |
| POST | `/api/insights` | Personalized shopping insights via Supermemory recall (drug_query + current scan context) |
| POST | `/api/tts/summary` | Vietnamese TTS audio summary of search results via ElevenLabs (returns audio/mpeg) |
| POST | `/api/optimize/stream` | Streaming prescription optimizer with SSE progress events |
| GET | `/api/memory/recall` | Supermemory context recall |
| GET | `/health` | Health check |
| GET | `/health/services` | Detailed service health (TinyFish, Exa, OpenRouter, Discord, ElevenLabs) |

---

## 9. Frontend — "The Abyss" Design System

### Design Direction

The frontend uses a dark cyberpunk-pharmaceutical aesthetic called **"The Abyss"** — deep-ocean themed with navy backgrounds, cyan accents, bioluminescent glow effects, and dramatic red alerts. Data-dense, monospace-heavy, inspired by Bloomberg terminals meets deep-sea exploration.

### Visual Enhancements

| Effect | Description |
|--------|-------------|
| **Bioluminescent Cards** | Glassmorphism with animated `bioGlow` keyframe, per-pharmacy glow colors |
| **Sonar Pulse Dots** | Concentric ring expansion on active agent status indicators |
| **Terminal Feed** | CRT scanline overlay, phosphor text glow, blinking cursor, window chrome |
| **Animated Latency Bars** | Gradient-shift bars in Model Router, completion flash on done |
| **Architecture Flow** | 3-column node-connector diagram with animated data flow connectors |

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `abyss` | `#0D1C32` | Primary page background |
| `deep` | `#010E24` | Input fields, nested panels |
| `card` | `#1C2A41` | Cards, sidebar surfaces |
| `cyan` | `#00DBE7` | Primary accent, active states |
| `alert-red` | `#EE4042` | Alerts, critical status |
| `success` | `#2DD4BF` | Stable, positive changes |
| `warn` | `#F97316` | Warnings, moderate changes |
| `t1` | `#D6E3FF` | Primary text |
| `t2` | `#94A3B8` | Secondary text, data |
| `t3` | `#64748B` | Muted labels, timestamps |

**Pharmacy Source Colors** (consistent across all components):
- Long Chau: `#3B82F6` (blue)
- Pharmacity: `#22C55E` (green)
- An Khang: `#F97316` (orange)
- Than Thien: `#A855F7` (purple)
- Medicare: `#14B8A6` (teal)

### Routes

| Route | Page Title | Description |
|-------|-----------|-------------|
| `/` | Landing Page | Hero section, feature grid, stats, infrastructure visualization, CTA to dashboard |
| `/dashboard` | Dashboard | Search + live SSE results + agent feed + metrics + price grid + savings + compliance + model router + voice summary |
| `/trends` | Depth Analysis | Recharts multi-source line chart, price summary table, time range selector |
| `/alerts` | Megalodon Alert System | Price tripwires (ARMED status) + sonar probes (recurring monitors) |
| `/optimize` | Prescription Optimizer | Multi-drug sourcing with OCR prescription upload, optimized vs single-source comparison |
| `/architecture` | System Architecture | 3-column node-connector diagram with all sponsor credits, tech stack, metrics |

### NavBar

```
[Megladon MD logo]  Dashboard | Trends | Alerts | Optimize | How It Works    [VN/EN]
```

### Key Components

| Component | Purpose |
|-----------|---------|
| `SearchBar` | Drug search input with quick-search buttons and **voice input** (Web Speech API) |
| `AgentActivityFeed` | Terminal-style real-time log of all agent events (spawn, searching, success, error, variant, investigate) with LIVE badge, sonar dots, amber investigate styling |
| `AgentCascade` | 4-tier pipeline visualization (OCR → Pharmacy → Variant → Analyst) with sonar status dots |
| `LiveMetricsBar` | 4 KPI counters: agents deployed, pharmacies scanned, products found, savings detected |
| `ModelRouterPanel` | Collapsible panel showing which LLM handled each step, animated latency bars, sponsor attribution |
| `PharmacyCards` | 5 agent status cards with bioluminescent glow, source colors, latency, result counts |
| `PriceGrid` | Sortable data table with source color dots, stock status, best price badges, variant labels |
| `SavingsBanner` | Prominent savings callout with VND amount and percentage |
| `CeilingPanel` | Government DAV price ceiling compliance analysis with violation severity |
| `SponsorBadge` | Tech sponsor pills (TinyFish, BrightData, Exa, OpenRouter, etc.) on result cards |
| `MegalodonAlert` | Red warning bar for price spikes (>100% spread) |
| `LiveBrowserPreview` | **War Room** — auto-expanded 5-column grid of live TinyFish browser sessions with status-aware borders (cyan=active, green=success, red=error) and results overlays on completion. Supports Tier 3 variant agent previews via composite keys. |
| `DemoAlertTrigger` | Button to fire Discord + ElevenLabs demo alert during presentation |
| `ComparisonBanner` | Speed comparison banner: manual search vs MegalodonMD with speedup multiplier |
| `PricingChart` | Recharts area/line chart with gradient fills, multi-source overlay |
| `AbyssFooter` | Live UTC sync clock, protocol links |
| `Counter` | Animated number counting with easeOutExpo easing (used in LiveMetricsBar, landing stats) |
| `AnimatedList` | Slide-in entry animation for list items (used in AgentActivityFeed) |
| `GlareHover` | Mouse-tracking radial gradient glare effect (used on PharmacyCards) |
| `Dock` | macOS-style magnification navigation with cosine proximity scaling (used in NavBar) |
| `ScrollReveal` | IntersectionObserver-based fade+slide animation for landing page sections |
| `Aurora` | Canvas-based animated background with cyan/teal gradients (landing page hero) |
| `VoiceSummary` | ElevenLabs Vietnamese TTS auto-play after search completes, with play/stop/retry states |
| `CounterfeitRiskPanel` | Price anomaly detection display with Exa-researched counterfeit risk reports |
| `LocaleProvider` | i18n context provider with VN/EN locale toggle and `useLocale()` hook |
| `NavBar` | Top navigation bar with route links and locale toggle |
| `MegalodonBadge` | Status badge system (best/critical/monitor/active/searching/error/out-of-stock) built on shadcn Badge |
| `ActionLabel` | Tier 4 analyst verdict banner with Vietnamese action directive, confidence score badge, expandable reasoning |

### Accessibility

- `prefers-reduced-motion` support: all continuous animations disabled
- SVG icons via Lucide React (no emoji as structural icons)
- `cursor: pointer` on all interactive elements
- Touch target minimum 16px on interactive dots (within 44px+ containers)
- High contrast text (WCAG AA compliant dark mode)

### UI Component Library

Built on **shadcn/ui** (v4, base-nova preset) with custom animated components:

| Category | Components | Source |
|----------|-----------|--------|
| **Badges & Status** | Badge, MegalodonBadge, SponsorBadge, ReferencePriceBadge | shadcn Badge + custom wrappers |
| **Alerts** | Alert (AlertTitle, AlertDescription) | shadcn Alert |
| **Expand/Collapse** | Collapsible (ModelRouterPanel, LiveBrowserPreview), Accordion (ActionLabel) | shadcn Collapsible + Accordion |
| **Animations** | Counter (animated counting), AnimatedList (slide-in entries), GlareHover (mouse-tracking glare), ScrollReveal (scroll-triggered fade+slide), Aurora (canvas background) | Custom components |
| **Navigation** | Dock (macOS magnification nav) | Custom component |

### Design Decisions Log

1. **Dark-only** — no light mode toggle. The Abyss aesthetic is the product identity.
2. **Bioluminescent UI** — animated glow cards, sonar pulses, terminal feed, gradient bars for maximum demo impact.
3. **shadcn/ui foundation** — Badge, Alert, Collapsible, Accordion from shadcn for consistency; custom animated components (Counter, AnimatedList, GlareHover, Dock, ScrollReveal, Aurora) for visual polish.
4. **Supermemory integration** — search context recall hints shown above search bar when available.
5. **Recharts over hand-rolled SVG** — cleaner code, proper tooltips, responsive containers.
6. **VN/EN toggle** — fully implemented via `LocaleProvider` context with `useLocale()` hook across all components.
7. **Lucide React icons** — consistent SVG icon family, no emoji as structural icons.
8. **OCR preserved** — Optimize page keeps prescription photo upload → AI drug extraction flow.
9. **Architecture page** — 3-column node-connector diagram explaining full data flow with all sponsor credits.
10. **Voice input** — Web Speech API for Vietnamese drug name input, accessibility differentiator.
12. **Ocean video + Aurora layered background** — landing page hero with ocean footage underneath canvas-based aurora for bioluminescent shimmer.

---

## 10. Demo Script (5 Minutes)

### 0:00-0:30 | The Problem
"Same Metformin costs 45,000 VND here, 135,000 VND there. Vietnam has 57,000 pharmacies and zero unified pricing. Hospital procurement teams are flying blind in a $7 billion market."

### 0:30-2:00 | Live Search Demo (The Wow Moment)
Open dashboard. Type "Metformin 500mg" (or use Vietnamese voice input for extra impact).

**Watch in real time:**
- **Agent Activity Feed**: Terminal logs 25+ agent events with animated slide-in entries
- **Live Browser Preview**: iframe shows TinyFish clicking through Long Chau's website
- **5 Pharmacy Cards**: glow with bioluminescent effect + glare-on-hover as results stream in
- **Metrics Bar**: animated counters tick up (agents deployed, pharmacies scanned, products found)
- **Agent Cascade**: Tier 1 → Tier 2 → Tier 3 progression with sonar status dots
- **Model Router**: shows Qwen → TinyFish → Exa pipeline with animated latency bars
- **Savings Banner**: "Save ₫340,000 (47%)"
- **Anomaly Badges**: red "suspiciously low" (potential counterfeit), green "best value"
- **WHO Reference Badge**: "3.7× international benchmark"
- **Government Ceiling Panel**: flags DAV compliance violations
- **Analyst Verdict**: Vietnamese action directive with 0-100 confidence score
- **Vietnamese Voice Summary auto-plays**: "Metformin 500mg, giá rẻ nhất tại Long Châu, 45.000 đồng..."

### 2:00-2:30 | NL Multi-Drug Search
Type: "I need diabetes and blood pressure medications for a clinic." OpenRouter parses into Metformin + Amlodipine + Losartan. Parallel agents dispatch for all drugs. Comparison matrix shows optimal sourcing route with AI recommendation.

### 2:30-3:00 | Prescription OCR
Upload prescription photo on Optimize page. GPT-4o Vision extracts drugs via function calling. Watch 50+ agents spawn. Optimized sourcing matrix with total savings.

### 3:00-3:30 | Discord Alert + Architecture
Fire demo alert button — Discord webhook + Vietnamese voice note plays from phone. Navigate to Architecture page — 3-column flow crediting all 9 sponsor integrations.

### 3:30-5:00 | Enterprise Impact + Q&A
- $7-10B+ pharmaceutical market, growing 15%+ annually
- 1,192 public hospitals, 24,000+ FDI companies as target customers
- SaaS model: per-query pricing for procurement departments
- Regional expansion: Thailand, Philippines, Indonesia
- **"We built the Bloomberg Terminal for pharmaceutical procurement in Southeast Asia."**

---

## 11. Sponsor Integrations

| Sponsor | Integration | Prize Eligibility |
|---------|------------|-------------------|
| **TinyFish** | 5 parallel stealth web agents, Tier 3 scout-spawn | Enterprise Track |
| **BrightData** | Proxy for Long Chau, Pharmacity, An Khang | Data Collection |
| **Exa** | Drug variant discovery, WHO reference pricing, drug info cards | AI Search |
| **OpenRouter** | Model routing for Qwen + GPT-4o | LLM Integration |
| **OpenAI** | GPT-4o for OCR prescription extraction | Vision AI |
| **Qwen** | 2.5 72B for drug name normalization | LLM |
| **ElevenLabs** | Vietnamese TTS voice alerts | Voice AI |
| **Discord** | Webhook notifications for price alerts | Community |
| **Supermemory** | Search context recall across sessions | Memory |

---

## 12. Technical Architecture Details

### Agent Manager (`services/agent_manager.py`)

The `AgentManager` tracks the full lifecycle of every agent in a search session:

- **AgentTier enum**: `OCR`, `SEARCH`, `VARIANT` — categorizes agent purpose
- **Lifecycle**: `spawn(tier, name, target)` → `complete(id, count)` / `fail(id, error)`
- **Event draining**: `drain_events()` yields SSE-ready dicts (`agent_spawn`, `agent_complete`, `agent_fail`)
- **Stats**: `mgr.stats` returns aggregate counts (spawned, completed, failed) per tier
- **Tree**: `mgr.tree` returns parent-child agent relationships for cascade visualization

### SSE Event Protocol

The `/api/search` endpoint streams these typed events:

| Event Type | Payload | When |
|------------|---------|------|
| `pharmacy_status` | `{source_id, source_name, status: "searching"}` | Agent dispatched |
| `agent_spawn` | `{id, name, tier, target, parent_id}` | Agent created |
| `agent_complete` | `{agent_id, result_count}` | Agent finished successfully |
| `agent_fail` | `{agent_id, error}` | Agent failed |
| `model_used` | `{step, model, provider, latency_ms}` | LLM/service call completed |
| `{source_id, status, products, ...}` | Full `PharmacySearchResult` | Pharmacy results ready |
| `search_complete` | Summary with best_price, savings, variants, compliance, agents, dedup | All tiers done |
| `analyst_verdict` | `{action_label, action_label_en, risk_level, reasoning, confidence_score, buy_recommendation}` | Tier 4 cross-validation verdict (late event) |
| `anomaly_investigation` | `{product_name, unit_price, median_price, counterfeit_research, who_comparison, manufacturer_check}` | Per-product investigation result (Tier 5) |
| `counterfeit_risk` | `{risk_level, sources, report}` | Post-summary Exa research (legacy, replaced by investigation swarm) |

### Price Fluctuation Analysis (`services/price_fluctuation.py`)

Detects price changes across scans by comparing current results against prior price records in the database. Emits human-readable fluctuation lines (e.g., "Metformin 500mg at Long Chau: 45,000 → 42,000 VND (-6.7%)") included in the `search_complete` summary event.

### Counterfeit Risk Detection (Investigation Swarm)

Three-stage system:
1. **Price anomaly detection** (`services/exa.py:detect_price_anomaly()`): Flags products priced significantly below the median for their drug class
2. **Investigation swarm** (`services/exa.py:investigate_anomalous_product()`): Spawns one `INVESTIGATOR` agent per anomalous product (up to 5), each running counterfeit research, WHO price comparison, and manufacturer verification in parallel
3. **Manufacturer verification**: Checks product manufacturer against `KNOWN_GOOD_MANUFACTURERS` set (Stada, DHG Pharma, Pfizer, etc.) — surfaces VERIFIED/UNVERIFIED badges in the CounterfeitRiskPanel

Frontend displays via `CounterfeitRiskPanel.tsx` with severity-coded warnings.

### Shopping Insights (`services/shopping_insights.py`)

After search completes, the frontend calls `POST /api/insights` with:
- Current scan summary (best_price, savings, variants, fluctuations)
- Supermemory user ID for cross-session context

Returns a personalized Vietnamese/English insight combining current results with historical search patterns from Supermemory.

### Vietnamese Voice Summary (`services/elevenlabs.py` + `routers/tts.py`)

After search completes, the dashboard auto-plays a Vietnamese TTS summary:
- **Summary template**: `"{drug}, giá rẻ nhất tại {source}, {price} đồng. tiết kiệm {savings} đồng so với nơi đắt nhất. Tìm thấy {count} sản phẩm."`
- **Voice**: ElevenLabs `eleven_multilingual_v2` model, Sarah voice (fallback: Rachel)
- **Settings**: stability 0.65, similarity_boost 0.80, style 0.15, speaker_boost enabled
- **Frontend**: `VoiceSummary.tsx` auto-plays on mount, shows loading/playing/error states with replay button
- **ElevenLabs sponsor badge** visible during playback

### Caching & Performance

| Cache | TTL | Size | Strategy |
|-------|-----|------|----------|
| TinyFish results | 15 min | 200 entries | LRU eviction, in-memory |
| Exa variant results | 1 hour | Per drug name | Dict-based, in-memory |
| SSE event buffer | 200ms flush | Unbounded | Batched UI updates |
| Database | WAL mode | — | Concurrent reads, single writer |

### Error Handling & Resilience

| Component | Strategy |
|-----------|----------|
| TinyFish agents | 3 retries with exponential backoff (1s, 3s, 5s) |
| ElevenLabs TTS | Voice fallback chain (Sarah → Rachel → give up) |
| OpenRouter LLM | Model fallback chain (primary → fallback model) |
| TinyFish validation | `COMPLETED` ≠ success — validates extracted data separately |
| Price validation | Bounds check: 1,000–50,000,000 VND |
| Fuzzy matching | 0.2 threshold for generic drug name matching |
| JSON extraction | `_extract_json_array()` with balanced bracket detection, markdown fence stripping |
| Proxy | BrightData URL validated at config time, credential masking in logs |

### Environment Variables

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `TINYFISH_API_KEY` | Yes | — | TinyFish API authentication |
| `ELEVENLABS_API_KEY` | Yes | — | ElevenLabs TTS authentication |
| `EXA_API_KEY` | Yes | — | Exa semantic search |
| `OPENROUTER_API_KEY` | Yes | — | OpenRouter LLM routing |
| `OPENAI_API_KEY` | Yes | — | Direct OpenAI for Codex challenge |
| `DISCORD_WEBHOOK_URL` | No | — | Discord alert notifications |
| `BRIGHTDATA_PROXY_URL` | No | — | BrightData proxy for protected pharmacies |
| `SUPERMEMORY_API_KEY` | No | — | Supermemory cross-session context |
| `CORS_ORIGINS` | No | `localhost:3005,3000,3001` | Allowed CORS origins |
| `INSIGHTS_MODEL` | No | `qwen/qwen-2.5-72b-instruct` | Model for shopping insights |
| `OPENROUTER_OCR_MODEL` | No | `openai/gpt-4o` | Configurable OCR model |
| `OPENROUTER_NORMALIZATION_MODEL` | No | `qwen/qwen-2.5-72b-instruct` | Drug name normalization model |
| `OPENROUTER_FALLBACK_MODEL` | No | `anthropic/claude-sonnet-4-20250514` | LLM fallback model |

### Database Schema

SQLite with WAL mode. Tables:

- **`sources`** — 5 Tier 1 pharmacy chains (seeded on init)
- **`drugs`** — Drug metadata
- **`prices`** — Price observations with timestamps, source_id, product details
- **`alerts`** — User-configured price threshold alerts
- **`monitor_jobs`** — APScheduler recurring monitor configurations
- **`gov_prices`** — Government DAV ceiling prices (5 drugs seeded for demo)

---

## 13. Phase 9: Hackathon Power Features

### 13.1 — NL Multi-Drug Search via OpenRouter

**Endpoint**: `POST /api/nl-search`

Flow:
1. User submits a natural language query (e.g., "compare Metformin and Glucophage across all pharmacies")
2. OpenRouter LLM parses the query and extracts a list of drug names
3. Backend dispatches parallel TinyFish searches for each drug simultaneously
4. Results are assembled into a structured sourcing matrix
5. AI generates a procurement recommendation summarizing optimal sourcing per drug

Frontend additions: `NLSearchBar` component on Trends page, `ComparisonMatrix` table with mode toggle between single-drug and multi-drug views. Qualifies for OpenRouter sponsor prize.

### 13.2 — Exa International Reference Pricing Badges

WHO reference price badges displayed on `PriceGrid` product rows:
- Shows the international reference price alongside the Vietnamese pharmacy price
- Calculates a multiplier: "1.2× WHO price" or "3.7× WHO price"
- Sourced via Exa `category: "research paper"` search for WHO/MSH price benchmarks
- Provides immediate visual context for whether Vietnam prices are globally competitive

Qualifies for Exa sponsor prize by adding a fifth distinct Exa use case.

### 13.3 — Historical Price Sparklines

**Endpoint**: `GET /api/sparklines/{drug}`

Returns per-source price history from the SQLite `prices` table. Frontend `SparklineChart` component rendered inline on `PharmacyCards`, showing a mini trend line for each pharmacy source. Provides visual proof of the platform's monitoring capability over time.

### 13.4 — Ocean Video Landing Page

Progressive enhancement on the hero section of the landing page (`/`):
- Video background plays if the video file is present
- Falls back gracefully to existing static background if video is absent
- No hard dependency on video asset for build or deployment

### 13.5 — Multi-Drug Comparison Matrix

Comparison matrix on the Trends page showing:
- Rows: each drug in the query
- Columns: each pharmacy source
- Cells: best available price per drug per source
- Footer row: optimal sourcing route with total cost and savings vs single-source
- AI-generated procurement recommendation paragraph via OpenRouter

---

## 14. Success Metrics

- 5+ pharmacy sources scraped simultaneously in <30 seconds
- Real-time SSE streaming with pharmacy cards lighting up + agent activity feed
- Multi-tier agent cascade: Tier 1 (search) → Tier 2 (Exa variants) → Tier 3 (scout-spawn)
- Price variance >100% detected and displayed (Megalodon Alert)
- Concrete savings shown in SavingsBanner with VND + percentage
- Government ceiling compliance violations flagged
- Discord alerts with Vietnamese voice summaries (ElevenLabs)
- Model Router shows full LLM pipeline with latency tracking
- Prescription optimizer shows measurable savings via OCR
- All 6 frontend routes render in Abyss dark theme with bioluminescent effects
- Architecture page clearly credits all sponsor integrations
- Voice input works for Vietnamese drug names
- Vietnamese voice summary auto-plays after search (ElevenLabs sponsor prize)
- Counterfeit risk detection flags anomalously cheap products
- Price fluctuation tracking across scans with human-readable trend lines
- Cross-validation confidence scoring (0-100) from 5 weighted signals across all agent tiers
- Actionable Vietnamese labels via Tier 4 Analyst agent ("Mua tại Long Châu" not "Best price: 45,000 VND")
- Personalized shopping insights via Supermemory cross-session context
- All sponsor integrations visible via SponsorBadge on result cards
