# GhostDriver - Implementation Plan

## Context

Building GhostDriver from scratch for LotusHacks 2026. Vietnamese traffic incident analysis platform: 3 parallel data fetches (violation history via TinyFish, scene analysis via Fal.AI, legal search via Exa), AI synthesis (GPT-4o + Qwen), and triple output (dashboard, voice, PDF).

---

## Phase 1: Project Scaffolding & Environment

**Goal**: Both frontend and backend running locally with all dependencies.

- [ ] Initialize Next.js app in `frontend/` with Tailwind CSS
- [ ] Initialize FastAPI app in `backend/` with modular structure (`routers/`, `services/`, `models/`)
- [ ] Create `.env.example` with all API keys (TinyFish, Fal.AI, Exa, OpenAI, Qwen, JigsawStack, ElevenLabs, Redis)
- [ ] Add `docker-compose.yml` for Redis
- [ ] Add `requirements.txt` and `package.json` dependencies
- [ ] **Verify**: both servers start, Redis connects

---

## Phase 2: Backend Core -- API & Data Models

**Goal**: `/analyze` endpoint accepts input, returns mock structured response.

- [ ] Define Pydantic models: `AnalyzeRequest`, `ViolationRecord`, `SceneAnalysis`, `LegalReference`, `EvidenceReport`, `AnalyzeResponse`
- [ ] Implement `/analyze` endpoint with mock data returns
- [ ] Add CORS middleware and file upload handling
- [ ] **Verify**: POST to `/analyze` returns mock JSON

---

## Phase 3: Frontend -- Input Form & Layout

**Goal**: Single-page UI that collects inputs and displays results.

- [ ] Build `AnalyzeForm` component: plate input, vehicle type dropdown, image upload, optional fields
- [ ] Build `ProgressBar` component: 3-segment bar (Violations | Scene | Legal)
- [ ] Build `Dashboard` component: risk score, violation table, scene card, legal list, fault summary
- [ ] Wire form to backend `/analyze`
- [ ] **Verify**: form submits, mock data renders

---

## Phase 4: Backend Services -- Three Parallel Fetches

**Goal**: Real API calls for all three data sources running in parallel.

### Task 1: TinyFish (Violation History)
- [ ] TinyFish API client with CAPTCHA-solving prompt for csgt.vn
- [ ] Parse response into `ViolationRecord` list
- [ ] Add vr.org.vn registration/inspection lookup

### Task 2: Fal.AI (Scene Analysis)
- [ ] Vision API client with damage/impact/conditions prompt
- [ ] Parse into `SceneAnalysis` model

### Task 3: Exa (Legal Search)
- [ ] Search API client for Vietnamese traffic law
- [ ] Parse into `LegalReference` list

### Integration
- [ ] Wire all three into `asyncio.gather()` with `return_exceptions=True`
- [ ] **Verify**: real API calls return structured data

---

## Phase 5: Redis Caching

**Goal**: Cache TinyFish results by plate number.

- [ ] Cache service with `aioredis`, key: `violations:{plate}`, 24-hour TTL
- [ ] Check cache before TinyFish, store after
- [ ] **Verify**: second request for same plate hits cache

---

## Phase 6: AI Synthesis Layer

**Goal**: GPT-4o + Qwen combine all sources into evidence report.

- [ ] GPT-4o system prompt: Vietnamese traffic incident analyst
- [ ] Feed all three outputs, produce 5-section report
- [ ] Parallel Qwen call for Vietnamese text parsing from csgt.vn
- [ ] **Verify**: synthesis produces violation summary, scene findings, legal codes, fault assessment, next steps

---

## Phase 7: Output Layer -- PDF & Voice

**Goal**: PDF export and Vietnamese voice narration.

- [ ] JigsawStack: format report → PDF, add download endpoint
- [ ] ElevenLabs: summary text → Vietnamese audio, add audio endpoint
- [ ] Frontend: PDF download button + audio player
- [ ] **Verify**: PDF downloads, audio plays

---

## Phase 8: Live Progress Bar (SSE)

**Goal**: Real-time progress as each fetch completes.

- [ ] SSE endpoint: `GET /analyze/stream`
- [ ] Emit progress events per task completion
- [ ] Frontend `EventSource` updates progress bar
- [ ] **Verify**: progress bar animates live

---

## Phase 9: Polish & Demo Prep

**Goal**: Demo-ready with real data.

- [ ] Prepare test plate number + sample incident photo
- [ ] Loading states, error handling, Vietnamese labels
- [ ] Style dashboard for visual impact
- [ ] End-to-end test against success metrics:
  - [ ] Analysis < 15 seconds
  - [ ] All 3 fetches resolve
  - [ ] PDF has 5 sections
  - [ ] Voice works
  - [ ] Cache reduces repeat calls
- [ ] Dry-run the 6-step demo script

---

## Tech Stack Reference

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

---

## Key Decisions

- **SSE over WebSocket** -- simpler for one-way progress, no bidirectional needed
- **asyncio.gather with return_exceptions=True** -- one failed fetch doesn't block others
- **Redis over in-memory** -- persists across restarts, standard caching
- **Separate Qwen call** -- Vietnamese parsing is distinct from synthesis
- **JigsawStack for PDF** -- avoids custom templates, uses built-in document structuring
