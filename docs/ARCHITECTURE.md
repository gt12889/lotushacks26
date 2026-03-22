# How It Works — Megalodon MD

End-to-end data flow of the Megalodon MD platform.

---

## High-Level Flow

```
User (search / voice / prescription upload)
  │
  ▼
Next.js 16 Frontend ──── React 19 · Tailwind v4 · Recharts · EN/VI i18n
  │ SSE
  ▼
FastAPI Backend ──────── Python · SSE · APScheduler · 20+ endpoints
  │
  ├── SQLite ──────────── aiosqlite · prices, alerts, monitors, gov ceilings
  │
  ├── TinyFish ────────── 5 parallel stealth agents · /run + /run-batch
  ├── BrightData ──────── Proxy + anti-bot · 3 pharmacy chains
  ├── Exa ─────────────── Drug intelligence · semantic search
  ├── OpenRouter ──────── Qwen 2.5 72B + GPT-4o + Claude · LLM routing
  ├── ElevenLabs ──────── Vietnamese TTS · multilingual v2
  ├── Discord ─────────── Alert webhooks · voice note attachments
  ├── Supermemory ──────── Search recall · hybrid search
  ├── GPT-4o Vision ───── Prescription OCR · function calling
  └── Twilio ──────────── Voice call alerts · ElevenLabs audio playback
```

---

## 6-Tier Agent Cascade

| Tier | Name | Description | Powered by |
|------|------|-------------|------------|
| T1 | **OCR** | Prescription extraction | GPT-4o Vision |
| T2 | **Search** | 5 parallel pharmacy agents | TinyFish |
| T3 | **Variant** | Generic discovery | Exa |
| T4 | **Scout** | Variant re-search per chain | TinyFish spawn |
| T5 | **Analyst** | Cross-validation | Qwen 2.5 72B |
| T6 | **Investigator** | Anomaly verification | Exa + LLM |

---

## Intelligence

| Feature | Description |
|---------|-------------|
| **Confidence Scoring** | 5-signal weighted score (0–100): source agreement, price convergence, compliance, anomalies, variant coverage |
| **Counterfeit Detection** | Exa-powered anomaly flagging for suspicious pricing and regulatory risk |
| **Gov Ceiling Compliance** | DAV price ceiling checks against registered drug categories |
| **NL Query Parsing** | Natural language → structured drug list with condition mapping |
| **Variant Discovery** | Exa finds generics + branded alternatives per pharmacy |
| **Price Fluctuation** | Per-source trend detection vs historical observations |

---

## Proactive Monitors

| Behavior | Trigger | Action |
|----------|---------|--------|
| **Price Drop Detection** | ≥10% decrease | Discord + Twilio call |
| **Anomaly Watchdog** | >2 SD below mean | Counterfeit warning |
| **Compliance Violation** | Exceeds DAV ceiling | Auto-report |

### Alert Channels

- **Discord** — Webhook with Vietnamese voice note attachment
- **Twilio** — Phone call with ElevenLabs audio playback
- **ElevenLabs** — Vietnamese TTS for both channels

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
| **Web Agents** | TinyFish stealth agents + BrightData proxy |
| **Intelligence** | Exa semantic search, WHO pricing, counterfeit detection |
| **LLM** | OpenRouter (Qwen 2.5 72B, GPT-4o, Claude) |
| **OCR** | GPT-4o Vision with function calling |
| **Voice** | ElevenLabs multilingual v2 + Twilio calls |
| **Memory** | Supermemory hybrid search + recall |
| **Alerts** | Discord webhooks + Twilio voice calls |
| **i18n** | EN/VI locale toggle, 150+ keys |
| **Voice Input** | Web Speech API (vi-VN) |
| **Deploy** | Docker + Railway |

---

## Sponsor Integrations

| Sponsor | Role |
|---------|------|
| **TinyFish** | 5 parallel stealth scrapers + batch API |
| **BrightData** | Proxy for 3 chains with anti-bot bypass |
| **Exa** | Drug variants, WHO pricing, counterfeit risk |
| **OpenRouter** | LLM routing — normalization, analysis, insights |
| **ElevenLabs** | Vietnamese voice alerts + summaries |
| **Discord** | Price alerts + anomaly warnings |
| **Supermemory** | Cross-session search recall |
| **OpenAI** | GPT-4o Vision prescription OCR |
| **Twilio** | Voice call alerts on price changes |
