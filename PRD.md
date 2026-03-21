# Megladon MD PRD

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

**Megladon MD** is an AI-powered pharmaceutical price intelligence platform that deploys parallel TinyFish web agents across Vietnamese pharmacy chain websites simultaneously, returning unified, structured drug pricing data in real time.

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
│  Live browser preview (iframe) → Procurement alerts     │
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
   │  /run-batch for multi-drug   │
   │  (up to 100 runs atomic)     │
   ▼        ▼        ▼             ▼
┌─────────────────────────────────────────────────────────┐
│                   SQLite DATABASE                        │
│  drugs | prices | sources | alerts | monitor_jobs       │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              NOTIFICATION LAYER                          │
│  Telegram Bot API  →  procurement team alerts           │
│  ElevenLabs TTS    →  Vietnamese voice summary          │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Core User Flows

### Flow 1: On-Demand Price Search (Primary Demo)
1. Procurement manager types drug name (e.g., "Metformin 500mg")
2. Backend dispatches 5+ TinyFish agents simultaneously
3. Results stream back via SSE. Pharmacy cards light up as each responds.
4. Dashboard displays unified comparison grid
5. System highlights cheapest option and calculates savings

### Flow 2: Persistent Price Monitoring
1. Set up monitor: "Track Metformin 500mg every 15 minutes"
2. APScheduler triggers TinyFish agents on interval
3. Price observations stored in SQLite with timestamps
4. Telegram alert + ElevenLabs Vietnamese voice when price drops

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

## 6. Tech Stack

| Layer | Technology |
|-------|-----------|
| Web Agent | TinyFish API (AsyncTinyFish) |
| Backend | FastAPI (Python) |
| Database | SQLite |
| Scheduler | APScheduler |
| Frontend | Next.js 16, React 19, Tailwind CSS v4, Recharts |
| Notifications | Telegram Bot API |
| Voice | ElevenLabs API |
| Search | Exa API |
| LLM | OpenRouter |
| Memory | Supermemory (search context recall) |

---

## 7. API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/search` | Trigger parallel price search (SSE stream with live browser URLs) |
| POST | `/api/optimize` | Prescription cost optimizer (uses /run-batch for atomic multi-drug search) |
| POST | `/api/optimize/prescription` | OCR prescription image → extract drugs → optimize (GPT-4o function calling) |
| GET | `/api/prices/{drug_query}` | Get cached results |
| GET | `/api/trends/{drug_query}` | Historical price data |
| POST | `/api/alerts` | Configure price alerts |
| POST | `/api/monitor` | Set up recurring monitor |

---

## 8. Frontend — "The Abyss" Design System

### Design Direction

The frontend uses a dark cyberpunk-pharmaceutical aesthetic called **"The Abyss"** — deep-ocean themed with navy backgrounds, cyan accents, and dramatic red alerts. Data-dense, monospace-heavy, inspired by Bloomberg terminals meets deep-sea exploration.

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

### Routes

| Route | Page Title | Description |
|-------|-----------|-------------|
| `/` | Dashboard | Two-column layout: search + live SSE results + AWP/WAC chart + Pricing Abyss Index table + Sonar Filters sidebar |
| `/trends` | Depth Analysis | Recharts multi-source line chart, price summary table, time range selector |
| `/alerts` | Megalodon Alert System | Price tripwires (ARMED status) + sonar probes (recurring monitors) |
| `/optimize` | Prescription Optimizer | Multi-drug sourcing with OCR prescription upload, optimized vs single-source comparison |
| `/architecture` | How It Works | Static architecture diagram for judges — pipeline visualization + tech stack + metrics |

### NavBar

```
[MediScrape logo]  Dashboard | Trends | Alerts | Optimize | How It Works    [VN/EN]
```

### Key Components

| Component | Purpose |
|-----------|---------|
| `MegalodonAlert` | Red warning bar for price spikes (>100% spread) |
| `StatusPill` | Colored status badges (TINYFISH, CRITICAL, MONITOR, ARMED, etc.) |
| `SonarFilters` | Right sidebar: molecule selector, AWP/WAC toggle, time range, drug class chips, manufacturer, price threshold slider |
| `PricingChart` | Recharts area/line chart with gradient fills, multi-source overlay |
| `PharmacyCards` | 5 agent status cards with source colors, latency, result counts |
| `LiveBrowserPreview` | Collapsible iframe panel showing live TinyFish browser sessions per pharmacy |
| `PriceGrid` | Sortable data table with source color dots, stock status, best price badges |
| `AbyssFooter` | Live UTC sync clock, protocol links |

### Design Decisions Log

1. **Dark-only** — no light mode toggle. The Abyss aesthetic is the product identity.
2. **Mock data on dashboard** — AWP/WAC chart and Pricing Abyss Index table show demo data matching the SVG design. Real search results overlay above when a probe is deployed.
3. **Supermemory integration** — search context recall hints shown above search bar when available.
4. **Recharts over hand-rolled SVG** — cleaner code, proper tooltips, responsive containers.
5. **VN/EN toggle** — decorative for demo, no i18n implementation.
6. **Pharmacy source colors** — consistent across all components: Long Chau (#3B82F6), Pharmacity (#22C55E), An Khang (#F97316), Than Thien (#A855F7), Medicare (#14B8A6).
7. **OCR preserved** — Optimize page keeps prescription photo upload → AI drug extraction flow.
8. **Architecture page** — static, no backend dependency, explains TinyFish parallel agent approach for judges.

---

## 9. Demo Script (5 Minutes)

1. **0:00-0:30 | Problem**: "Same Metformin costs 45K VND here, 135K VND there. 57,000 pharmacies. No unified pricing."
2. **0:30-2:00 | Live Demo**: Open dashboard — Megalodon Alert bar shows price spike. Deploy probe for "Metformin 500mg", expand Live Browser Preview to show real browsers navigating pharmacy sites in real time. Watch 5 pharmacy agent cards light up with latency data. Show Pricing Abyss Index table. Run prescription optimizer with OCR photo upload (uses /run-batch for atomic 25-run submission).
3. **2:00-2:45 | Architecture**: Navigate to How It Works page — TinyFish parallel agents, asyncio.gather, SSE streaming, Supermemory context recall.
4. **2:45-3:15 | Enterprise Impact**: $7B+ market, 1,192 hospitals, 24,000+ FDI companies.
5. **3:15-4:00 | Sponsors & Future**: TinyFish + AWS + BrightData + ElevenLabs + Exa + Supermemory. Expand to 50+ sources, hospital ERP integration, regional expansion.

---

## 10. Success Metrics

- 5+ pharmacy sources scraped simultaneously in <30 seconds
- Real-time SSE streaming with pharmacy cards lighting up
- Price variance >100% detected and displayed (Megalodon Alert)
- Telegram alerts with Vietnamese voice summaries
- Prescription optimizer shows measurable savings
- All 5 frontend routes render in Abyss dark theme without light-mode artifacts
- Recharts price trend visualization working with real data
- Architecture page clearly explains system for judges
