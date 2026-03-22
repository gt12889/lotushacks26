# System Architecture — Megalodon MD

End-to-end data flow of the Megalodon MD intelligence platform.

---

## High-Level Flow

```
User (search / voice / prescription upload)
  │
  ▼
Next.js 16 Frontend ──── React 19 · Tailwind v4 · Recharts
  │                       6 pages, 16+ dashboard components, EN/VI i18n
  │ SSE
  ▼
FastAPI Backend ──────── Python · SSE · APScheduler · 20+ endpoints
  │                       Async orchestration hub
  │
  ├── SQLite ──────────── aiosqlite · prices, alerts, monitors, gov ceilings
  │
  ├── TinyFish ────────── 5 parallel stealth web agents · /run + /run-batch
  ├── BrightData ──────── Proxy + anti-bot bypass · 3 pharmacy chains
  ├── Exa ─────────────── Drug variants, WHO pricing, counterfeit risk · semantic search
  ├── OpenRouter ──────── Qwen 2.5 72B + GPT-4o + Claude fallback · model routing
  ├── ElevenLabs ──────── Vietnamese TTS voice alerts · multilingual v2
  ├── Discord ─────────── Webhook price alerts + audio · markdown + attachments
  ├── Supermemory ──────── Cross-session search recall · hybrid search
  └── GPT-4o Vision ───── Prescription OCR with function calling · structured extraction
```

---

## 6-Tier Agent Cascade

| Tier | Name | Description |
|------|------|-------------|
| T1 | **OCR** | Prescription extraction (GPT-4o Vision) |
| T2 | **Search** | 5 parallel pharmacy agents (TinyFish) |
| T3 | **Variant** | Exa generic discovery per drug |
| T4 | **Scout** | Variant re-search per chain (TinyFish spawn) |
| T5 | **Analyst** | LLM cross-validation (Qwen 2.5 72B) |
| T6 | **Investigator** | Anomaly price verification swarm |

---

## Dashboard Components

| Component | Description |
|-----------|-------------|
| **SearchBar** | Text + voice input (vi-VN Web Speech API) |
| **PharmacyCards** | 5 chain result cards + sparklines |
| **PriceGrid** | Sortable product table + anomaly flags |
| **AgentFeed** | Terminal-style event log |
| **LiveMetrics** | KPI counters: agents, products, savings |
| **AgentCascade** | 6-tier visual pipeline |
| **ModelRouter** | Model step tracking + latency bars |
| **AnalystVerdict** | 5-signal confidence breakdown |
| **PricingChart** | 7/30/90D price history (Recharts) |
| **CounterfeitRisk** | Anomaly + regulatory warnings |
| **CeilingPanel** | Gov price compliance check |
| **VoiceSummary** | ElevenLabs audio playback |
| **LivePreview** | Agent status + streaming URLs |
| **DemoAlert** | Discord test notification |
| **SavingsBanner** | Best price + procurement projection |
| **ComparisonBanner** | Search timing + result stats |

---

## Application Pages

| Page | Description |
|------|-------------|
| **Landing** | Hero, live stats, features, infrastructure |
| **Dashboard** | Main search hub with full agent cascade |
| **Trends** | Single drug + AI multi-search analysis |
| **Alerts** | Price alerts + proactive monitors |
| **Optimize** | Prescription OCR + multi-drug sourcing |
| **Architecture** | System diagram (this page / this doc) |

---

## Intelligence & Analysis

| Feature | Description |
|---------|-------------|
| **Confidence Scoring** | Source agreement (30) + price convergence (20) + compliance (15) + anomaly-free (20) + variant coverage (15) = 100pt scale |
| **Counterfeit Detection** | Exa-powered anomaly flagging for suspicious pricing patterns and regulatory risk assessment |
| **Gov Ceiling Compliance** | DAV (Dept of Administration) price ceiling checks against 5+ registered drug categories |
| **NL Query Parsing** | Natural language → structured drug list. Maps conditions (diabetes, hypertension) to first-line drugs |
| **Variant Discovery** | Exa semantic search finds generics + branded alternatives per pharmacy per drug |
| **Price Fluctuation** | Per-source trend detection comparing current scan vs historical DB observations |

---

## Proactive Monitor Behaviors

| Behavior | Trigger | Action |
|----------|---------|--------|
| **Price Drop Detection** | ≥10% decrease | Discord alert with comparison data |
| **Anomaly Watchdog** | >2 SD below mean | Counterfeit warning alert |
| **Compliance Violation** | Exceeds DAV ceiling | Auto-report to configured channel |

---

## Key Stats

| Metric | Value |
|--------|-------|
| Parallel Agents | 5 simultaneous pharmacy searches |
| Avg Response | <30s full results from all sources |
| Stores Covered | 3,700+ across 5 pharmacy chains |
| API Endpoints | 20+ (search, optimize, alerts, trends...) |

---

## Technology Stack

| Area | Technologies |
|------|-------------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS v4, Recharts |
| **Backend** | FastAPI, SSE, APScheduler, aiosqlite |
| **Web Agents** | TinyFish parallel stealth agents + BrightData proxy |
| **Intelligence** | Exa semantic search, WHO pricing, counterfeit detection |
| **LLM Routing** | OpenRouter (Qwen 2.5 72B, GPT-4o, Claude fallback) |
| **OCR** | GPT-4o Vision with function calling |
| **Voice** | ElevenLabs multilingual v2 (Vietnamese TTS) |
| **Memory** | Supermemory hybrid search + context recall |
| **Alerts** | Discord webhooks + voice note attachments |
| **i18n** | EN/VI locale toggle, 150+ translated keys |
| **Voice Input** | Web Speech API (vi-VN), browser-native |
| **Deploy** | Docker + Railway, Nixpacks fallback |

---

## Sponsor Integration Map

| Sponsor | Role |
|---------|------|
| **TinyFish** | Core agent infra — 5 parallel stealth scrapers + batch API |
| **BrightData** | Proxy layer for 3 chains with anti-bot bypass |
| **Exa** | Drug variants, WHO pricing, counterfeit risk, drug info |
| **OpenRouter** | LLM routing — normalization, analysis, NL parsing, insights |
| **ElevenLabs** | Vietnamese voice alerts + search summaries |
| **Discord** | Price alerts, anomaly warnings, compliance violations |
| **Supermemory** | Cross-session drug search recall + personalization |
| **OpenAI** | GPT-4o Vision prescription OCR + structured extraction |
