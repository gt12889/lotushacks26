# 

> **MegalodonMD**  Vietnamese pharmaceutical price intelligence with parallel AI web agents.

> Vietnam has 57,000+ pharmacies. Same medication can vary 100-300% in price. No unified pricing exists.

AI-powered pharmaceutical price intelligence platform that deploys parallel TinyFish web agents across Vietnamese pharmacy chain websites, returning unified drug pricing data in real time.

Built for **LotusHacks 2026** | Enterprise Track


## Quick Start

### Prerequisites
- Node.js 
- Python 3.11+

### 1. Environment Setup


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

Visit **http://localhost:3005**

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web Agent | TinyFish (5 parallel stealth agents, /run-batch for optimizer) |
| Backend | FastAPI + asyncio |
| Database | SQLite (aiosqlite) |
| Scheduler | APScheduler |
| Frontend | Next.js + Tailwind |
| Notifications | Discord Webhooks |
| Voice | ElevenLabs |
| Drug Intelligence | Exa (variant discovery, WHO reference pricing, drug info summaries) |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/search?query=...` | SSE streaming price search (with live browser preview URLs) |
| POST | `/api/optimize` | Prescription cost optimizer (atomic /run-batch for multi-drug) |
| POST | `/api/optimize/prescription` | OCR prescription image → drug extraction → optimize |
| GET | `/api/prices/{query}` | Cached price data |
| GET | `/api/trends/{query}` | Historical price trends |
| POST | `/api/alerts` | Configure price alerts |
| POST | `/api/monitor` | Set up recurring monitor |
| GET | `/api/alerts` | List active alerts |
| DELETE | `/api/alerts/{id}` | Deactivate an alert |
| GET | `/api/monitors` | List active monitors |
| POST | `/api/ocr` | OCR prescription image → extract drug names |
| POST | `/api/demo-alert` | Trigger demo Discord + voice alert |
| GET | `/api/memory/recall` | Supermemory context recall |
| GET | `/health` | Health check |
| GET | `/health/services` | Detailed service health status |

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
Search Query → 5 Parallel TinyFish Agents (stealth) → SSE Stream → Dashboard
               ├─ Long Chau agent  [stealth+proxy]          ├─ Live Browser Preview (iframe)
               ├─ Pharmacity agent [stealth+proxy]           ├─ Pharmacy Cards
               ├─ An Khang agent   [stealth+proxy]           ├─ Price Grid
               ├─ Than Thien agent [stealth]    → SQLite     ├─ Savings Banner
               └─ Medicare agent   [stealth]    → Discord    └─ Optimizer

Prescription → /run-batch (atomic, up to 100 runs) → Poll Results → Optimized Sourcing
```
