# Megalodon MD

**MegalodonMD** — Vietnamese pharmaceutical price intelligence with parallel AI web agents.

> Vietnam has 57,000+ pharmacies. Same medication can vary 100–300% in price. No unified pricing exists.

AI-powered pharmaceutical price intelligence platform that deploys parallel TinyFish web agents across Vietnamese pharmacy chain websites, returning unified drug pricing data in real time.

Built for **LotusHacks 2026** | Enterprise Track

---

## What Shipped

- FastAPI backend with **SSE search** across **5 pharmacy sources** (TinyFish)
- Next.js dashboard: search, results, metrics, agent feed, live preview
- **6-tier agent cascade**: OCR → Search → Variant → Scout → Analyst → Investigator
- SQLite persistence (prices, sources, alerts, monitors, government ceilings)
- **EN/VI** locale toggle
- **Supermemory** recall for cross-session context
- **LLM insights** and shopping advice (OpenRouter)
- **OCR** prescription → optimizer pipeline
- **Discord** + **ElevenLabs** voice alerts
- **Trends**, **Alerts**, **Optimize** pages wired end-to-end
- Dockerfiles + Railway deploy configs

---

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+ (3.12 recommended)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
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

### Environment

Backend (`.env` or Railway vars):
- `TINYFISH_API_KEY` (required)
- Optional: `EXA_API_KEY`, `OPENROUTER_API_KEY`, `OPENAI_API_KEY`, `BRIGHTDATA_PROXY_URL`, `SUPERMEMORY_API_KEY`, `ELEVENLABS_API_KEY`, `DISCORD_WEBHOOK_URL`

Frontend (`frontend/.env.local`):
- `NEXT_PUBLIC_API_URL=http://localhost:8000`

Quick checks:
- API: http://localhost:8000/health
- UI: http://localhost:3005
- If browser can't reach API: check `CORS_ORIGINS` includes `http://localhost:3005`

---

## Deploy on Railway

Two services from the **same GitHub repo**, different Root Directories.

1. **Backend (FastAPI)** — Root Directory: `backend`, add API keys + `CORS_ORIGINS` → Generate Domain
2. **Frontend (Next.js)** — Root Directory: `frontend`, set `NEXT_PUBLIC_API_URL` to backend URL → Generate Domain

Config-as-code: `backend/railway.toml` and `frontend/railway.toml` use the Dockerfile builder.

### Docker Compose (no Railway)

```bash
docker-compose up --build
```

See root `docker-compose.yml` and `railway.env.example` for variable names.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web Agents | TinyFish (5 parallel stealth agents, /run-batch for optimizer) |
| Backend | FastAPI + asyncio + SSE |
| Database | SQLite (aiosqlite) |
| Scheduler | APScheduler |
| Frontend | Next.js 16, React 19, Tailwind CSS v4, Recharts |
| Notifications | Discord Webhooks |
| Voice | ElevenLabs (Vietnamese TTS) |
| Drug Intelligence | Exa (variant discovery, WHO reference pricing, counterfeit detection) |
| LLM Routing | OpenRouter (Qwen 2.5 72B, GPT-4o, Claude Sonnet fallback) |
| Memory | Supermemory (cross-session context recall) |
| OCR | GPT-4o with function calling |
| Proxy | BrightData (stealth + anti-bot bypass) |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/search?query=...` | SSE streaming price search |
| POST | `/api/optimize` | Prescription cost optimizer |
| POST | `/api/optimize/stream` | SSE streaming optimizer |
| POST | `/api/optimize/prescription` | OCR prescription → optimize |
| POST | `/api/nl-search` | Natural language multi-drug search |
| GET | `/api/prices/{query}` | Cached price data |
| GET | `/api/trends/{query}` | Historical price trends |
| GET | `/api/sparklines/{query}` | Per-source sparkline data |
| POST | `/api/alerts` | Configure price alert |
| GET | `/api/alerts` | List active alerts |
| DELETE | `/api/alerts/{id}` | Deactivate alert |
| POST | `/api/monitor` | Set up recurring monitor |
| GET | `/api/monitors` | List active monitors |
| POST | `/api/ocr` | OCR prescription image |
| POST | `/api/insights` | Personalized shopping insights |
| POST | `/api/tts/summary` | Vietnamese TTS summary |
| POST | `/api/demo-alert` | Demo Discord + voice alert |
| GET | `/api/memory/recall` | Supermemory context recall |
| GET | `/api/stats` | Live DB statistics |
| GET | `/health` | Health check |
| GET | `/health/services` | Detailed service health |

## Pharmacy Sources

| Chain | Stores | URL |
|-------|--------|-----|
| FPT Long Chau | 2,117+ | nhathuoclongchau.com.vn |
| Pharmacity | 957+ | pharmacity.vn |
| An Khang | 527+ | ankhang.vn |
| Than Thien | 100+ | nhathuocthanhtien.vn |
| Medicare | 50+ | medicare.vn |
