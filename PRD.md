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
│  Voice input → Prescription OCR → Zalo share            │
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
13. Results shareable via **Zalo deep link**

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

The search system uses a 3-tier agent cascade, visualized in real-time via the **Agent Cascade Pipeline** component:

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
| `/` | Dashboard | Search + live SSE results + agent feed + metrics + price grid + savings + compliance + model router |
| `/trends` | Depth Analysis | Recharts multi-source line chart, price summary table, time range selector |
| `/alerts` | Megalodon Alert System | Price tripwires (ARMED status) + sonar probes (recurring monitors) |
| `/optimize` | Prescription Optimizer | Multi-drug sourcing with OCR prescription upload, optimized vs single-source comparison |
| `/architecture` | System Architecture | 3-column node-connector diagram with all sponsor credits, tech stack, metrics |

### Key Components

| Component | Purpose |
|-----------|---------|
| `SearchBar` | Drug search input with quick-search buttons and **voice input** (Web Speech API) |
| `AgentActivityFeed` | Terminal-style real-time log of all agent events (spawn, searching, success, error, variant) with LIVE badge, sonar dots, blinking cursor |
| `AgentCascade` | 3-tier pipeline visualization (OCR → Pharmacy → Variant) with sonar status dots |
| `LiveMetricsBar` | 4 KPI counters: agents deployed, pharmacies scanned, products found, savings detected |
| `ModelRouterPanel` | Collapsible panel showing which LLM handled each step, animated latency bars, sponsor attribution |
| `PharmacyCards` | 5 agent status cards with bioluminescent glow, source colors, latency, result counts |
| `PriceGrid` | Sortable data table with source color dots, stock status, best price badges, variant labels |
| `SavingsBanner` | Prominent savings callout with VND amount and percentage |
| `CeilingPanel` | Government DAV price ceiling compliance analysis with violation severity |
| `SponsorBadge` | Tech sponsor pills (TinyFish, BrightData, Exa, OpenRouter, etc.) on result cards |
| `MegalodonAlert` | Red warning bar for price spikes (>100% spread) |
| `LiveBrowserPreview` | Collapsible iframe panel showing live TinyFish browser sessions |
| `DemoAlertTrigger` | Button to fire Discord + ElevenLabs demo alert during presentation |
| `SonarFilters` | Right sidebar: molecule selector, AWP/WAC toggle, time range, drug class chips |
| `PricingChart` | Recharts area/line chart with gradient fills, multi-source overlay |
| `AbyssFooter` | Live UTC sync clock, protocol links |

### Accessibility

- `prefers-reduced-motion` support: all continuous animations disabled
- SVG icons via Lucide React (no emoji as structural icons)
- `cursor: pointer` on all interactive elements
- Touch target minimum 16px on interactive dots (within 44px+ containers)
- High contrast text (WCAG AA compliant dark mode)

### Design Decisions Log

1. **Dark-only** — no light mode toggle. The Abyss aesthetic is the product identity.
2. **Bioluminescent UI** — animated glow cards, sonar pulses, terminal feed, gradient bars for maximum demo impact.
3. **Supermemory integration** — search context recall hints shown above search bar when available.
4. **Recharts over hand-rolled SVG** — cleaner code, proper tooltips, responsive containers.
5. **VN/EN toggle** — decorative for demo, no i18n implementation.
6. **Lucide React icons** — consistent SVG icon family, no emoji as structural icons.
7. **OCR preserved** — Optimize page keeps prescription photo upload → AI drug extraction flow.
8. **Architecture page** — 3-column node-connector diagram explaining full data flow with all sponsor credits.
9. **Voice input** — Web Speech API for Vietnamese drug name input, accessibility differentiator.
10. **Zalo share** — Deep link to share results via Vietnam's dominant messaging app.

---

## 10. Demo Script (5 Minutes)

1. **0:00-0:30 | Problem**: "Same Metformin costs 45K VND here, 135K VND there. 57,000 pharmacies. No unified pricing."
2. **0:30-2:00 | Live Demo**: Open dashboard — Megalodon Alert bar shows price spike. Use voice input or type "Metformin 500mg". Watch Agent Activity Feed log 47 agent events. 5 pharmacy cards light up with bioluminescent glow. Live Metrics Bar ticks up. Agent Cascade shows Tier 1 → Tier 2 → Tier 3 progression. Model Router shows Qwen → TinyFish → Exa pipeline with latency. SavingsBanner shows "Save ₫340,000 (47%)". Government Ceiling Panel flags violations.
3. **2:00-2:30 | Prescription OCR**: Upload photo on Optimize page. Watch 50+ agents spawn for multi-drug search.
4. **2:30-3:00 | Discord Alert**: Fire demo alert — play Vietnamese voice note from phone speaker.
5. **3:00-3:30 | Architecture**: Navigate to System Architecture page — 3-column flow showing all sponsors.
6. **3:30-4:00 | Enterprise Impact**: $7B+ market, 1,192 hospitals, 24,000+ FDI companies. Share results via Zalo.
7. **4:00-4:30 | Sponsors & Future**: TinyFish + BrightData + Exa + OpenRouter + ElevenLabs + Discord. Expand to 50+ sources, hospital ERP integration, regional expansion.

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

## 12. Success Metrics

- 5+ pharmacy sources scraped simultaneously in <30 seconds
- Real-time SSE streaming with pharmacy cards lighting up + agent activity feed
- Multi-tier agent cascade: Tier 1 (search) → Tier 2 (Exa variants) → Tier 3 (scout-spawn)
- Price variance >100% detected and displayed (Megalodon Alert)
- Concrete savings shown in SavingsBanner with VND + percentage
- Government ceiling compliance violations flagged
- Discord alerts with Vietnamese voice summaries (ElevenLabs)
- Model Router shows full LLM pipeline with latency tracking
- Prescription optimizer shows measurable savings via OCR
- All 5 frontend routes render in Abyss dark theme with bioluminescent effects
- Architecture page clearly credits all sponsor integrations
- Voice input works for Vietnamese drug names
- All sponsor integrations visible via SponsorBadge on result cards
