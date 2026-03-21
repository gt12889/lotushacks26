# Architecture — Megladon MD

## High-level

```text
Browser (Next.js 16, App Router)
    │  HTTPS / SSE (EventSource)
    ▼
FastAPI (Python 3.12+)
    ├── Search router → TinyFish parallel runs per pharmacy
    ├── SQLite (aiosqlite) — prices, sources, alerts, monitors
    ├── Optional: OpenRouter / OpenAI (normalize, OCR, insights)
    ├── Optional: Exa (discovery), Supermemory (recall)
    └── Scheduler (APScheduler) for monitors / periodic tasks
```

## Request flow: price search

1. User submits query on **Dashboard**.  
2. Frontend opens **SSE** stream to `POST /api/search?query=…`.  
3. Backend spawns **one agent path per pharmacy source** (up to 5).  
4. Events stream back: **agent status**, **pharmacy payloads**, **summary**, optional **model_used** / **streaming_url** for live preview.  
5. UI updates **cards**, **grid**, **metrics**, **feed** incrementally.

## Key directories (monorepo)

| Path | Role |
|------|------|
| `frontend/` | Next.js UI, `src/app`, `src/components` |
| `backend/` | FastAPI `main.py`, `routers/`, `services/` |
| `docs/` | Pitch, demo, deploy, PRD |

## Deploy (production)

- **Two services** typical: **API** + **static/Node UI**.  
- See **`docs/README.md`** (Railway, Docker, env vars).

## Diagram (ASCII)

```text
Search Query
    → Orchestrator (FastAPI)
        → TinyFish Agent (Long Chau)
        → TinyFish Agent (Pharmacity)
        → TinyFish Agent (An Khang)
        → TinyFish Agent (Than Thien)
        → TinyFish Agent (Medicare)
    → SSE stream → Dashboard (live UI)
    → SQLite (cache / history)
```

Prescription **optimizer** uses **batch** TinyFish runs where configured; see API table in **`docs/README.md`**.
