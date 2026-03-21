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

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/search?query=...` | SSE streaming price search |
| GET | `/api/prices/{query}` | Cached price data |
| GET | `/api/trends/{query}` | Historical price trends |
| POST | `/api/alerts` | Configure price alerts |
| POST | `/api/monitor` | Set up recurring monitor |
| POST | `/api/optimize` | Prescription cost optimizer |
| GET | `/health` | Health check |

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
