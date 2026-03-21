# MediScrape PRD

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

**MediScrape** is an AI-powered pharmaceutical price intelligence platform that deploys parallel TinyFish web agents across Vietnamese pharmacy chain websites simultaneously, returning unified, structured drug pricing data in real time.

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
│  Procurement alerts → Historical analytics              │
└───────────────────────┬─────────────────────────────────┘
                        │ REST API + SSE
┌───────────────────────┴─────────────────────────────────┐
│                   FASTAPI BACKEND                        │
│                                                         │
│  POST /api/search      - parallel price search          │
│  GET  /api/prices      - cached results                 │
│  GET  /api/trends      - historical price data          │
│  POST /api/alerts      - price alerts                   │
│  POST /api/monitor     - recurring monitor              │
│  GET  /api/optimize    - prescription optimizer          │
└──┬──────────┬──────────┬──────────┬─────────────────────┘
   │          │          │          │
   ▼          ▼          ▼          ▼
┌──────┐ ┌──────┐ ┌──────┐ ┌──────────────┐
│TinyF.│ │TinyF.│ │TinyF.│ │  APScheduler │
│Agent │ │Agent │ │Agent │ │  (cron jobs)  │
│Long  │ │Pharm │ │An    │ │  15-min cycle │
│Chau  │ │acity │ │Khang │ │              │
└──┬───┘ └──┬───┘ └──┬───┘ └──────┬───────┘
   │        │        │             │
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
1. Input full prescription (multiple drugs)
2. Parallel searches for ALL drugs across ALL sources
3. Returns optimized sourcing plan to minimize total cost

---

## 6. Tech Stack

| Layer | Technology |
|-------|-----------|
| Web Agent | TinyFish API (AsyncTinyFish) |
| Backend | FastAPI (Python) |
| Database | SQLite |
| Scheduler | APScheduler |
| Frontend | React (Next.js) + Tailwind |
| Notifications | Telegram Bot API |
| Voice | ElevenLabs API |
| Search | Exa API |
| LLM | OpenRouter |

---

## 7. API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/search` | Trigger parallel price search (SSE stream) |
| GET | `/api/prices/{drug_query}` | Get cached results |
| GET | `/api/trends/{drug_query}` | Historical price data |
| POST | `/api/alerts` | Configure price alerts |
| POST | `/api/monitor` | Set up recurring monitor |
| GET | `/api/optimize` | Prescription cost optimizer |

---

## 8. Demo Script (5 Minutes)

1. **0:00-0:30 | Problem**: "Same Metformin costs 45K VND here, 135K VND there. 57,000 pharmacies. No unified pricing."
2. **0:30-2:00 | Live Demo**: Type "Metformin 500mg", watch 5 pharmacy cards light up in real time. Show 3x price difference. Run prescription optimizer.
3. **2:00-2:45 | Architecture**: TinyFish parallel agents, asyncio.gather, SSE streaming, APScheduler monitoring.
4. **2:45-3:15 | Enterprise Impact**: $7B+ market, 1,192 hospitals, 24,000+ FDI companies.
5. **3:15-4:00 | Sponsors & Future**: TinyFish + AWS + BrightData + ElevenLabs + Exa. Expand to 50+ sources, hospital ERP integration, regional expansion.

---

## 9. Success Metrics

- 5+ pharmacy sources scraped simultaneously in <30 seconds
- Real-time SSE streaming with pharmacy cards lighting up
- Price variance >100% detected and displayed
- Telegram alerts with Vietnamese voice summaries
- Prescription optimizer shows measurable savings
