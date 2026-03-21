# MegalodonMD

**AI-Powered Pharmaceutical Price Intelligence for Vietnam**

> Vietnam has 57,000+ pharmacies. Same medication varies 100-300% in price. No unified pricing exists. We fix that with parallel AI web agents.

**LotusHacks 2026 | Enterprise Track**

---

## Quick Start

```bash
# Backend
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev
```

Visit **http://localhost:3005**

See [docs/SETUP.md](docs/SETUP.md) for env vars and detailed setup.

## Deploy

- **Railway**: [docs/README.md](docs/README.md) (two-service deploy from one repo)
- **Docker Compose**: [docs/DOCKER-COMPOSE.md](docs/DOCKER-COMPOSE.md) + [docker-compose.yml](docker-compose.yml)
- **Env template**: [railway.env.example](railway.env.example)

## Documentation

All project docs live in [`docs/`](docs/INDEX.md):

| Doc | Purpose |
|-----|---------|
| [PRD](docs/PRD.md) | Product requirements, architecture, tech stack, components |
| [ARCHITECTURE](docs/ARCHITECTURE.md) | System diagram & data flows |
| [SPONSORS](docs/SPONSORS.md) | Sponsor challenge audit & implementation status |
| [PLAN](docs/PLAN.md) | Implementation phases (all complete) |
| [DEMO](docs/DEMO.md) | Live demo script & timing |
| [PITCH](docs/PITCH.md) | One-page judge pitch |
| [SLIDES](docs/SLIDES.md) | Slide bullet outline |
| [Q&A](docs/Q&A.md) | Anticipated judge questions |
| [KNOWN-ISSUES](docs/KNOWN-ISSUES.md) | Honest limitations for Q&A |

## Sponsor Integrations (9)

| Sponsor | Role |
|---------|------|
| **TinyFish** | 5 parallel stealth agents, 4-tier cascade, /run-batch, live browser preview |
| **BrightData** | Proxy on 3 chains with Vietnam geo-targeting |
| **OpenRouter** | NL multi-drug search, Qwen + GPT-4o routing, fallback chain |
| **Exa** | 5 use cases: variants, WHO pricing, drug info, counterfeit risk, scout-spawn |
| **ElevenLabs** | Vietnamese TTS voice summaries + Discord voice alerts |
| **OpenAI** | GPT-4o Vision + function calling for prescription OCR |
| **Qwen** | 2.5 72B Vietnamese drug name normalization |
| **Discord** | Webhook notifications for price alerts |
| **Supermemory** | Cross-session search context recall |

---

**Built for LotusHacks 2026 Enterprise Track**
