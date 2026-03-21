# GhostDriver

> **Pitch: Crashout Cop** — Vietnamese traffic incident analysis with vision models and predictive models.
>
> Vietnam has 72 million motorbikes. Zero protection when things go wrong.

AI-powered Vietnamese traffic incident analysis platform. Enter a license plate, upload an incident photo, and get a comprehensive evidence report with violation history, scene analysis, legal references, and fault assessment.

Built for **LotusHacks 2026**.

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker (for Redis)

### 1. Environment Setup
```bash
cp .env.example .env
# Fill in your API keys in .env
```

### 2. Start Redis
```bash
docker compose up -d
```

### 3. Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit **http://localhost:3000**

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js + Tailwind |
| Backend | FastAPI + asyncio |
| Web Agent | TinyFish (csgt.vn + vr.org.vn) |
| Vision | Fal.AI |
| Legal Search | Exa |
| Synthesis | OpenAI GPT-4o + Qwen |
| Formatting | JigsawStack |
| Caching | Redis |
| Voice | ElevenLabs |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/analyze` | Full analysis (JSON response) |
| POST | `/analyze/stream` | SSE streaming analysis with live progress |
| GET | `/reports/{id}/pdf` | Download PDF report |
| GET | `/reports/{id}/audio` | Play Vietnamese audio summary |
| GET | `/health` | Health check |

## Architecture

```
User Input → 3 Parallel Fetches → AI Synthesis → Triple Output
              ├─ TinyFish (violations)     GPT-4o + Qwen    ├─ Dashboard
              ├─ Fal.AI (scene)                               ├─ Voice (ElevenLabs)
              └─ Exa (legal)                                  └─ PDF (JigsawStack)
```
