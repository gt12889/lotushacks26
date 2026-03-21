# 

> **MEGLADON MD**  Vietnamese pharmaceutical price intelligence with parallel AI web agents.

> Vietnam has 57,000+ pharmacies. Same medication can vary 100-300% in price. No unified pricing exists.

AI-powered pharmaceutical price intelligence platform that deploys parallel TinyFish web agents across Vietnamese pharmacy chain websites, returning unified drug pricing data in real time.

Built for **LotusHacks 2026** | Enterprise Track


## Quick Start

### Prerequisites
- Node.js 
- Python 3.11+

### 1. Environment Setup

Copy `.env.example` to `.env` at the repo root (backend reads it via `backend/config.py`). Set at least `TINYFISH_API_KEY` for searches.

**Supermemory (optional)** — Per-browser recall of past drug searches on the home page:

- `SUPERMEMORY_API_KEY` — API key from [Supermemory](https://supermemory.ai); when unset, recall and persistence are skipped.
- Smoke test (from repo root, after the key is in `.env`):  
  `python backend/scripts/verify_supermemory.py`

**Production**

- `CORS_ORIGINS` — Comma-separated browser origins allowed to call the API (e.g. `https://your-app.vercel.app,http://localhost:3000`). Defaults to localhost ports if unset in code.
- Frontend: set `NEXT_PUBLIC_API_URL` to your deployed API base URL.

**Personalized insights** — After each search, the home page calls `POST /api/insights` (English note from the current scan + optional Supermemory recall). Requires `OPENROUTER_API_KEY`. Optional: `INSIGHTS_MODEL` (see `.env.example`).

### 2. Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit **http://localhost:3000**

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web Agent | TinyFish (5 parallel agents) |
| Backend | FastAPI + asyncio |
| Database | SQLite (aiosqlite) |
| Scheduler | APScheduler |
| Frontend | Next.js + Tailwind |
| Notifications | Telegram Bot API |
| Voice | ElevenLabs |
| Search | Exa |
| Memory | Supermemory (optional) |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/search?query=...` | SSE streaming price search; final summary may include `price_fluctuations` (per chain vs last stored scan for that drug) |
| POST | `/api/search?query=...&memory_user=...` | Same; when Supermemory is configured, stores summary + fluctuation text for recall |
| GET | `/api/memory/recall?q=...&user=...` | Hybrid memory recall for the dashboard (requires `SUPERMEMORY_API_KEY`) |
| POST | `/api/insights` | JSON body: `user`, `drug_query`, `current_scan` — English personalized note (requires `OPENROUTER_API_KEY`; Supermemory optional) |
| GET | `/api/prices/{query}` | Cached price data |
| GET | `/api/trends/{query}` | Historical price trends |
| POST | `/api/alerts` | Configure price alerts |
| POST | `/api/monitor` | Set up recurring monitor |
| POST | `/api/optimize` | Prescription cost optimizer |
| GET | `/health` | Health check; includes `supermemory_configured` (bool, non-secret) |

## Pharmacy Sources

| Chain | Stores | URL |
|-------|--------|-----|
| FPT Long Chau | 2,117+ | nhathuoclongchau.com.vn |
| Pharmacity | 957+ | pharmacity.vn |
| An Khang | 527+ | ankhang.vn |
| Than Thien | 100+ | nhathuocthanhtien.vn |
| Medicare | 50+ | medicare.vn |

## Architecture

```
Search Query → 5 Parallel TinyFish Agents → SSE Stream → Dashboard
               ├─ Long Chau agent                         ├─ Pharmacy Cards
               ├─ Pharmacity agent                         ├─ Price Grid
               ├─ An Khang agent         → SQLite          ├─ Savings Banner
               ├─ Than Thien agent       → APScheduler     ├─ Trend Charts
               └─ Medicare agent         → Telegram/Voice  └─ Optimizer
```
