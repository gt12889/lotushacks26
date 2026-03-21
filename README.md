 **MegalodonMD**  Vietnamese pharmaceutical price intelligence with parallel AI web agents.

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

## Deploy on Railway (live demo URL)

Two services from the **same GitHub repo**, different **Root Directory**s.

1. **Backend (FastAPI)**  
   - [Railway Dashboard](https://railway.app) → **New Project** → **Deploy from GitHub** → select this repo.  
   - Open the service → **Settings** → **Root Directory** → `backend`.  
   - **Variables**: copy names from `railway.env.example` (API keys + **`CORS_ORIGINS`**).  
   - **`CORS_ORIGINS`** must list your frontend’s public URL (comma-separated), e.g. `https://your-frontend.up.railway.app,http://localhost:3005`. If unset, the API only allows `http://localhost:3005`.  
   - **Settings → Networking → Generate Domain** → note the URL (e.g. `https://xxx.up.railway.app`).

2. **Frontend (Next.js)**  
   - **Add service** → same repo → **Root Directory** → `frontend`.  
   - **Variables**: `NEXT_PUBLIC_API_URL` = backend public URL (**no** trailing slash).  
   - Redeploy the frontend after setting or changing this (Next bakes it in at build time).  
   - **Networking** → generate a public domain for the UI.

3. **SQLite**  
   - Default DB file lives on the service filesystem and can reset on redeploy. For a hackathon demo that is usually fine; for persistence, add a **Volume** in Railway and point `DATABASE_URL` at a path on that volume.

4. **CLI (optional)**  
   - `npm i -g @railway/cli` → `railway login` → from `backend/` or `frontend/` run `railway link` to attach a folder to an existing service.

Config-as-code: `backend/railway.toml` and `frontend/railway.toml` use the **Dockerfile** builder (`backend/Dockerfile`, `frontend/Dockerfile`) so deploys work the same from GitHub, CLI, or a registry.

### Without GitHub

**A. Railway CLI (zip-style deploy from your laptop)**  
1. Install: `npm i -g @railway/cli` → `railway login`.  
2. Create an **empty** project in the dashboard (or `railway init` in a folder).  
3. **Backend:** `cd backend` → `railway link` (pick/create the API service) → set **Root Directory** to `.` or leave service tied to this repo path (CLI uploads the current directory). Run `railway up` to build and deploy the Dockerfile.  
4. **Frontend:** `cd frontend` → `railway link` (other service) → set **`NEXT_PUBLIC_API_URL`** in Variables to your API’s public URL → `railway up`.  
5. Set **`CORS_ORIGINS`** on the backend service to include the frontend public URL.

**B. Docker image (any registry)**  
```bash
# Backend
docker build -t YOUR_USER/megladon-api:latest ./backend
docker push YOUR_USER/megladon-api:latest

# Frontend (set real API URL at build time)
docker build --build-arg NEXT_PUBLIC_API_URL=https://YOUR-API.up.railway.app -t YOUR_USER/megladon-web:latest ./frontend
docker push YOUR_USER/megladon-web:latest
```  
In Railway: **New** → **Docker Image** → paste image name → add env vars on the service (backend still needs `CORS_ORIGINS`, etc.).

**C. Switch back to Nixpacks**  
If you prefer Railway’s auto build without Docker, change `[build] builder = "NIXPACKS"` and remove `dockerfilePath` in each `railway.toml`, and set `startCommand` again as in git history.

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
| LLM Routing | OpenRouter (Qwen 2.5 72B, GPT-4o) |
| Memory | Supermemory (cross-session context recall) |

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
| POST | `/api/insights` | Personalized shopping insights via Supermemory context |
| POST | `/api/tts/summary` | Vietnamese TTS audio summary of search results (ElevenLabs) |
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
