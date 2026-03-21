# Local setup — Megladon MD

## Prerequisites

- **Node.js** 20+ (see `frontend/package.json` `engines`)  
- **Python** 3.11+ (3.12 recommended; see `backend/.python-version`)

## 1. Clone and env

From repository root:

```bash
cp backend/../.env.example ./.env   # if you maintain .env.example at repo root
# Or create .env at repo root OR configure only Railway/host env vars
```

Minimum backend variables (names only — use your keys):

- `TINYFISH_API_KEY`  
- Optional: `EXA_API_KEY`, `OPENROUTER_API_KEY`, `OPENAI_API_KEY`, `BRIGHTDATA_PROXY_URL`, `SUPERMEMORY_API_KEY`, …

Frontend:

- `NEXT_PUBLIC_API_URL=http://localhost:8000` (in `frontend/.env.local`)

## 2. Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## 3. Frontend

```bash
cd frontend
npm install
npm run dev
# opens on http://localhost:3005 (see package.json script)
```

## 4. Quick checks

- API: <http://localhost:8000/health>  
- UI: <http://localhost:3005>  
- If browser can’t reach API: check **`CORS_ORIGINS`** in backend settings includes `http://localhost:3005`.

## Deploy

See **`docs/README.md`** (Railway + Docker + `../railway.env.example` at repo root).
