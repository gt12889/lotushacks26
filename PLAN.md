# MediScrape - Implementation Plan

## Context

Pivoting from GhostDriver to MediScrape for LotusHacks 2026. Pharmaceutical price intelligence platform using parallel TinyFish agents to scrape 5+ Vietnamese pharmacy websites simultaneously.

---

## Phase 1: Project Restructure & Database

**Goal**: Replace GhostDriver scaffolding, set up SQLite schema.

- [ ] Update backend structure for MediScrape (new services, models)
- [ ] Implement SQLite database with schema (sources, drugs, prices, alerts, monitor_jobs)
- [ ] Seed sources table with 5 Tier 1 pharmacies
- [ ] Update .env.example and requirements.txt
- [ ] **Verify**: Database creates, sources seeded

---

## Phase 2: TinyFish Pharmacy Agents

**Goal**: Parallel scraping of 5 pharmacy websites.

- [ ] Define pharmacy configs (URL patterns, goal prompts) for all 5 sources
- [ ] Implement TinyFish client with AsyncTinyFish pattern
- [ ] Build `search_all_pharmacies()` with `asyncio.gather()`
- [ ] Parse and normalize product results (name, price, manufacturer, pack_size, unit_price)
- [ ] Drug name fuzzy matching / normalization
- [ ] **Verify**: Search returns structured results from all 5 sources

---

## Phase 3: API Endpoints & SSE Streaming

**Goal**: Core search API with real-time streaming.

- [ ] `POST /api/search` -- SSE stream of results per pharmacy
- [ ] `GET /api/prices/{drug_query}` -- cached results from SQLite
- [ ] `GET /api/trends/{drug_query}` -- historical price data
- [ ] `POST /api/alerts` -- price threshold alerts
- [ ] `POST /api/monitor` -- recurring monitor jobs
- [ ] `GET /api/optimize` -- multi-drug prescription optimizer
- [ ] **Verify**: SSE streams results as each pharmacy responds

---

## Phase 4: Frontend Dashboard

**Goal**: React dashboard with live pharmacy cards and price grid.

- [ ] Search bar component with drug name input
- [ ] Pharmacy cards (5 cards, light up on SSE events)
- [ ] Price comparison grid (sortable table)
- [ ] Savings calculator ("Save X VND by buying from Y")
- [ ] Price trend chart component
- [ ] Prescription optimizer UI (multi-drug input)
- [ ] **Verify**: Full search-to-display flow working

---

## Phase 5: Monitoring & Notifications

**Goal**: APScheduler + Telegram + ElevenLabs alerts.

- [ ] APScheduler integration for recurring price checks
- [ ] Telegram Bot setup for price drop notifications
- [ ] ElevenLabs Vietnamese TTS for voice alerts
- [ ] Alerts management UI
- [ ] **Verify**: Automated monitor triggers Telegram + voice alert

---

## Phase 6: Polish & Demo Prep

**Goal**: Demo-ready with real pharmacy data.

- [ ] Pre-cache demo data as fallback
- [ ] Error handling, loading states
- [ ] Mobile responsiveness
- [ ] Vietnamese language labels
- [ ] End-to-end test with real drug searches
- [ ] **Verify**: 5-minute demo script runs smoothly

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web Agent | TinyFish (parallel agents) |
| Backend | FastAPI + asyncio |
| Database | SQLite (aiosqlite) |
| Scheduler | APScheduler |
| Frontend | Next.js + Tailwind |
| Notifications | Telegram Bot API |
| Voice | ElevenLabs |
| Search | Exa |
| LLM | OpenRouter |
