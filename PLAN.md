# MediScrape - Implementation Plan

## Context

Pivoting from GhostDriver to MediScrape for LotusHacks 2026. Pharmaceutical price intelligence platform using parallel TinyFish agents to scrape 5+ Vietnamese pharmacy websites simultaneously.

---

## Phase 1: Project Restructure & Database

**Goal**: Replace GhostDriver scaffolding, set up SQLite schema.

- [x]Update backend structure for MediScrape (new services, models)
- [x]Implement SQLite database with schema (sources, drugs, prices, alerts, monitor_jobs)
- [x]Seed sources table with 5 Tier 1 pharmacies
- [x]Update .env.example and requirements.txt
- [x]**Verify**: Database creates, sources seeded

---

## Phase 2: TinyFish Pharmacy Agents

**Goal**: Parallel scraping of 5 pharmacy websites.

- [x]Define pharmacy configs (URL patterns, goal prompts) for all 5 sources
- [x]Implement TinyFish client with AsyncTinyFish pattern
- [x]Build `search_all_pharmacies()` with `asyncio.gather()`
- [x]Parse and normalize product results (name, price, manufacturer, pack_size, unit_price)
- [x]Drug name fuzzy matching / normalization
- [x]**Verify**: Search returns structured results from all 5 sources

---

## Phase 3: API Endpoints & SSE Streaming

**Goal**: Core search API with real-time streaming.

- [x]`POST /api/search` -- SSE stream of results per pharmacy
- [x]`GET /api/prices/{drug_query}` -- cached results from SQLite
- [x]`GET /api/trends/{drug_query}` -- historical price data
- [x]`POST /api/alerts` -- price threshold alerts
- [x]`POST /api/monitor` -- recurring monitor jobs
- [x]`POST /api/optimize` -- multi-drug prescription optimizer
- [x]**Verify**: SSE streams results as each pharmacy responds

---

## Phase 4: Frontend Dashboard

**Goal**: React dashboard with live pharmacy cards and price grid.

- [x]Search bar component with drug name input
- [x]Pharmacy cards (5 cards, light up on SSE events)
- [x]Price comparison grid (sortable table)
- [x]Savings calculator ("Save X VND by buying from Y")
- [x]Price trend chart component
- [x]Prescription optimizer UI (multi-drug input)
- [x]**Verify**: Full search-to-display flow working

---

## Phase 5: Monitoring & Notifications

**Goal**: APScheduler + Discord + ElevenLabs alerts.

- [x]APScheduler integration for recurring price checks
- [x]Discord webhook setup for price drop notifications
- [x]ElevenLabs Vietnamese TTS for voice alerts
- [x]Alerts management UI
- [x]**Verify**: Automated monitor triggers Discord + voice alert

---

## Phase 6: Polish & Demo Prep

**Goal**: Demo-ready with real pharmacy data.

- [x]Pre-cache demo data as fallback
- [x]Error handling, loading states
- [x]Mobile responsiveness
- [x]Vietnamese language labels
- [x]End-to-end test with real drug searches
- [x]**Verify**: 5-minute demo script runs smoothly

### Demo-Critical Features (Post-Audit Build)

- [x] Agent Activity Feed — scrolling real-time log of agent spawn/search/complete events (`AgentActivityFeed.tsx`)
- [x] Live Metrics Bar — ticking counters: agents deployed, pharmacies scanned, products found, savings (`LiveMetricsBar.tsx`)
- [x] SSE-animated pharmacy cards — cards start dimmed (opacity-40), glow on result arrival (`PharmacyCards.tsx`)
- [x] Sponsor tech badges — [TinyFish] [BrightData] pills on pharmacy cards and price grid rows (`SponsorBadge.tsx`)
- [x] Discord + ElevenLabs demo alert trigger — `POST /api/demo-alert` fires Vietnamese voice note to Discord (`DemoAlertTrigger.tsx` + `routers/demo_alert.py`)
- [x] Savings callout — already existed in `SavingsBanner.tsx` with percentage
- [x] Core search flow — already existed: SSE streaming, 5 parallel agents, price table

---

## Phase 7: Sponsor Challenge Fixes (Post-Audit)

**Goal**: Fix all sponsor integrations identified as broken/non-functional in audit.
**Reference**: See `SPONSORS.md` for full audit details.

### P0 — Security (Do First) ✅

- [x] ~~Rotate exposed ElevenLabs API key~~ — `.env` was never committed to git history
- [x] `.env` already in `.gitignore`

### P1 — Codex Challenge (Highest Impact — Was Disqualified) ✅

- [x] Install `openai>=1.0.0` SDK in `requirements.txt`
- [x] Add `OPENAI_API_KEY` to `config.py` and `.env`
- [x] Rewrite `services/ocr.py` to use OpenAI SDK directly (AsyncOpenAI client)
- [x] Implement function calling with `tools` parameter and structured schema (`extract_prescription_drugs`)
- [x] Parse `tool_calls` response — returns structured `{name, dosage, frequency, quantity}` dicts
- [x] Connect OCR → optimizer via new `POST /api/optimize/prescription` endpoint
- [x] **Verified**: OCR imports OK, function calling schema has 4 fields, both optimize routes exist

### P2 — Dead Code & Missing Env Vars (3 Sponsors Non-Functional) ✅

- [x] Add `BRIGHTDATA_PROXY_URL` to `.env`
- [x] Add `EXA_API_KEY` to `.env`
- [x] Integrate `services/qwen.py` into search pipeline via `routers/search.py`
  - Qwen normalizes Vietnamese drug queries before TinyFish search
- [x] **Verified**: Search router imports Qwen; all modules load cleanly

### P3 — ElevenLabs Voice ✅ (Pre-existing fix)

- [x] Voice IDs verified in commit `4506bec` — Sarah + Rachel with fallback chain
- [x] Vietnamese-optimized voice settings (stability 0.65, similarity 0.80)
- [x] Fallback: tries next voice on quota/failure before giving up

### P4 — TinyFish Hardening ✅

- [x] Add retry with exponential backoff (3 attempts, delays: 1s, 3s, 5s)
- [x] Replace JSON string-slicing with `_extract_json_array()` — handles markdown fences, balanced brackets
- [x] Add price range validation (1,000–50,000,000 VND)
- [x] Improved error logging with raw product context on parse failures
- [x] Lowered fuzzy threshold to 0.2 (was 0.3) to avoid over-filtering generics
- [x] **Verified**: Module imports OK, JSON extractor works, constants exported

### P5 — BrightData & Exa Polish ✅

- [x] Extend BrightData proxy to Pharmacity and An Khang (was Long Chau only)
- [x] Add proxy health check to `services/health.py`
- [x] Improve Exa variant extraction — regex-based drug name matching (replaces capitalized-word heuristic)
- [x] Cache Exa results per drug name (1-hour TTL)
- [x] Add Exa + OpenRouter + BrightData proxy to health check endpoint
- [x] **Verified**: Health services = [tinyfish, exa, openrouter, brightdata_proxy]

### P6 — OpenRouter Multi-Model ✅

- [x] Move model names to `config.py` env vars (`openrouter_ocr_model`, `openrouter_normalization_model`, `openrouter_fallback_model`)
- [x] Add model fallback chain in `qwen.py` — `_call_openrouter()` tries primary then fallback model
- [x] Add product deduplication across pharmacy sources in search summary (`deduplicated` field)
- [x] **Verified**: All modules import cleanly, routes confirmed

---

## Phase 8: Demo-Day Hardening (5 Critical Gaps)

**Goal**: Close 5 high-impact gaps identified from TinyFish API docs before demo.

### Gap 1 — Stealth Browser Profile ✅

- [x] Add `browser_profile: "stealth"` to all TinyFish requests (`services/tinyfish.py`)
- [x] Prevents bot detection on Long Chau (FPT-owned) and other protected sites

### Gap 2 — Production-Ready Goal Prompts ✅

- [x] Replace generic goals with per-pharmacy tailored prompts in `PHARMACY_CONFIGS`
- [x] Numbered steps, cookie/popup dismissal, CAPTCHA detection
- [x] Exact JSON schema with example output
- [x] Vietnamese edge cases: "Het hang" → `in_stock: false`, "Lien he" → `price: null`
- [x] Visual descriptions (not CSS selectors) for resilience

### Gap 3 — COMPLETED != Success Validation ✅

- [x] Add `_validate_tinyfish_result()` function
- [x] Distinguish infrastructure failure (FAILED) from goal failure (CAPTCHA, extraction error)
- [x] Structured error handling integrated into SSE parsing loop

### Gap 4 — SSE Event Parsing + Streaming URL ✅

- [x] Restructure SSE loop to handle typed events: STARTED, STREAMING_URL, PROGRESS, HEARTBEAT, COMPLETE
- [x] Add `streaming_url` field to `PharmacySearchResult` schema
- [x] Create `LiveBrowserPreview.tsx` — collapsible iframe panel showing live browser sessions
- [x] Wire streaming URLs into frontend SSE event handler and page state

### Gap 5 — /run-batch for Prescription Optimizer ✅

- [x] Add `TINYFISH_BATCH_URL` and `TINYFISH_RUN_URL` constants
- [x] Implement `_build_batch_runs()`, `_poll_run_result()`, `_parse_polled_result()`
- [x] Implement `search_all_pharmacies_batch()` — atomic multi-drug submission
- [x] Update `routers/optimize.py` to use batch when API key present, mock fallback preserved
- [x] **Verified**: Python files parse clean, TypeScript type-checks pass

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web Agent | TinyFish (parallel agents) |
| Backend | FastAPI + asyncio |
| Database | SQLite (aiosqlite) |
| Scheduler | APScheduler |
| Frontend | Next.js + Tailwind |
| Notifications | Discord Webhooks |
| Voice | ElevenLabs |
| Search | Exa |
| LLM | OpenRouter |
