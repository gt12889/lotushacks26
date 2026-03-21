# MegalodonMD

**AI-Powered Pharmaceutical Price Intelligence for Vietnam**

> Vietnam has 57,000+ pharmacies. Same medication varies 100-300% in price. No unified pricing exists. We fix that with parallel AI web agents.

**LotusHacks 2026 | Enterprise Track**

---

## What It Does

MegalodonMD deploys **5 parallel TinyFish stealth agents** across Vietnam's top pharmacy chains simultaneously, returning unified drug pricing data in real time. It doesn't just find the cheapest price — it finds the **safest cheapest price** with anomaly detection, government compliance checking, WHO reference benchmarks, and AI-powered confidence scoring.

## Sponsor Integrations (9 Total)

| Sponsor | Integration | Impact |
|---------|------------|--------|
| **TinyFish** | 5 parallel stealth agents, 4-tier cascade, /run-batch, live browser preview | Enterprise Track primary |
| **BrightData** | Proxy on 3 chains with Vietnam geo-targeting, anti-bot bypass | Data Collection |
| **OpenRouter** | NL multi-drug search, Qwen + GPT-4o routing, AI procurement recommendations, fallback chain | LLM Integration |
| **Exa** | 5 use cases: variant discovery, WHO pricing, drug info, counterfeit risk, scout-spawn triggers | AI Search |
| **ElevenLabs** | Vietnamese TTS voice summaries (auto-play) + Discord voice alerts | Voice AI |
| **OpenAI** | GPT-4o Vision + function calling for prescription OCR | Best Use of Codex |
| **Qwen** | 2.5 72B Vietnamese drug name normalization (diacritics, typos, slang) | LLM |
| **Discord** | Webhook notifications for price alerts with voice attachments | Community |
| **Supermemory** | Cross-session search context recall for personalized insights | Memory |

## Key Features

- **4-Tier Agent Cascade**: OCR -> 5 Parallel Search Agents -> Exa Variant Discovery -> Dynamic Scout-Spawn -> Analyst Verdict
- **Live Browser Preview**: Watch TinyFish agents navigate pharmacy websites in real-time via iframe
- **Price Anomaly Detection**: Statistical outlier flagging with color-coded badges (suspiciously low / overpriced / best value)
- **Vietnamese Voice Summary**: ElevenLabs TTS auto-plays after every search
- **NL Multi-Drug Search**: "I need diabetes and blood pressure meds" -> parallel agent dispatch -> comparison matrix
- **Prescription OCR**: Upload photo -> GPT-4o extracts drugs -> multi-pharmacy optimization
- **Government Compliance**: DAV ceiling price cross-reference with violation severity
- **WHO Reference Pricing**: International benchmark badges with multiplier comparison
- **Historical Sparklines**: Per-pharmacy price trend mini-charts
- **Confidence Scoring**: 5-signal weighted score (0-100) with Vietnamese action directives
- **Full i18n**: Vietnamese + English with voice input (Web Speech API)

## Pharmacy Sources

| Chain | Stores | Mode |
|-------|--------|------|
| FPT Long Chau | 2,117+ | Stealth + BrightData Proxy |
| Pharmacity | 957+ | Stealth + BrightData Proxy |
| An Khang | 527+ | Stealth + BrightData Proxy |
| Than Thien | 100+ | Stealth |
| Medicare | 50+ | Stealth |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web Agent | TinyFish (5 parallel stealth agents, /run-batch for optimizer) |
| Proxy | BrightData (Vietnam geo-targeting, anti-bot bypass) |
| Backend | FastAPI + asyncio + SQLite (WAL) + APScheduler |
| Frontend | Next.js 16 + React 19 + Tailwind CSS v4 + shadcn/ui |
| Charts | Recharts (price trends, sparklines) |
| Animations | Custom components (Counter, AnimatedList, GlareHover, Dock, ScrollReveal, Aurora) |
| Drug Intelligence | Exa (5 use cases: variants, WHO pricing, drug info, counterfeit risk, scout-spawn) |
| LLM Routing | OpenRouter (Qwen 2.5 72B + GPT-4o + Claude Sonnet fallback) |
| OCR | OpenAI GPT-4o Vision + Function Calling |
| Voice | ElevenLabs TTS (Vietnamese, eleven_multilingual_v2) |
| Notifications | Discord Webhooks (text + voice attachments) |
| Memory | Supermemory (cross-session context recall) |

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit **http://localhost:3005**

## Architecture

```
Search Query
    |
    v
Qwen 2.5 72B (normalize Vietnamese drug name)
    |
    v
5 Parallel TinyFish Stealth Agents -----> Live Browser Preview (iframe)
  | Long Chau  [stealth+proxy]              |
  | Pharmacity [stealth+proxy]              v
  | An Khang   [stealth+proxy]        SSE Streaming (23 event types)
  | Than Thien [stealth]                    |
  | Medicare   [stealth]                    v
    |                                  Dashboard
    v                                  ├─ Pharmacy Cards (glare hover)
Exa Variant Discovery                  ├─ Price Grid (anomaly badges)
    |                                  ├─ Agent Activity Feed (animated)
    v                                  ├─ Metrics Bar (animated counters)
Scout-Spawn NEW TinyFish Agents        ├─ Savings Banner
    |                                  ├─ WHO Reference Badges
    v                                  ├─ Government Ceiling Panel
Analyst Verdict (confidence 0-100)     ├─ Counterfeit Risk Panel
    |                                  └─ Vietnamese Voice Summary
    v
SQLite → APScheduler → Discord + Voice Alerts
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/search` | SSE streaming price search with agent tracking + live browser preview |
| POST | `/api/optimize` | Prescription cost optimizer (atomic /run-batch) |
| POST | `/api/optimize/prescription` | OCR image -> drug extraction -> optimize |
| POST | `/api/nl-search` | NL multi-drug search with AI procurement recommendation |
| GET | `/api/prices/{query}` | Cached price data |
| GET | `/api/trends/{query}` | Historical price trends |
| GET | `/api/sparklines/{drug}` | Price history for sparkline charts |
| POST | `/api/alerts` | Configure price alerts |
| POST | `/api/monitor` | Recurring monitor (APScheduler) |
| POST | `/api/ocr` | Prescription OCR (GPT-4o Vision) |
| POST | `/api/tts/summary` | Vietnamese TTS summary (ElevenLabs) |
| POST | `/api/demo-alert` | Demo Discord + voice alert |
| POST | `/api/insights` | Personalized insights via Supermemory |
| GET | `/health/services` | Detailed service health (all sponsors) |

## Design System: "The Abyss"

Dark cyberpunk-pharmaceutical aesthetic. Deep navy backgrounds, cyan accents, bioluminescent glow effects. Bloomberg Terminal meets deep-sea exploration.

- shadcn/ui component foundation with custom Abyss theme
- Ocean video + Aurora canvas layered landing page
- macOS Dock navigation with magnification hover
- Animated counters, glare hover cards, scroll-reveal sections
- Terminal-style agent feed with sonar pulse dots
- Per-pharmacy glow colors across all components

---

**Built for LotusHacks 2026 Enterprise Track**
