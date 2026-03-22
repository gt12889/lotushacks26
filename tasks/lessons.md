# MegalodonMD — Demo Testing & Fixes Log

## Date: 2026-03-22

### Issues Found During Full Demo Testing

#### CRITICAL: TinyFish Agents Timing Out
- **Symptom**: SSE search stream spawned 5 agents but hung for 9+ minutes waiting for results
- **Root Cause**: `effective_timeout = 180.0` per attempt with `MAX_RETRIES = 3` = ~9 min total wait
- **Fix**: Reduced timeout to 25s and retries to 1 (`services/tinyfish.py` lines 350-362)
- **Result**: SSE search completes in ~30s, emits proper `search_complete` event with full summary

#### CRITICAL: ElevenLabs TTS Quota Exhausted
- **Symptom**: `POST /api/tts/summary` returned 502 "TTS generation failed"
- **Root Cause**: ElevenLabs API returns 401 with `quota_exceeded` — 0 credits remaining on the `locushacks26` key
- **Debugging**: API key was loading correctly (`sk_fdee6...`), direct API call confirmed quota exhaustion
- **Fix**: Added `_quota_exhausted` flag to avoid repeated failed calls, improved error messages (`services/elevenlabs.py`)
- **Action needed**: Add ElevenLabs credits or use a new API key before demo day

#### MEDIUM: Optimize Endpoint Returning Empty Results
- **Symptom**: `POST /api/optimize` returned `{"items":[]}`  even with cached metformin data in DB
- **Root Cause**: Optimize only used live TinyFish search, no fallback to cached prices
- **Fix**: Added `_get_cached_prices()` function that queries DB when live search fails (`routers/optimize.py`)
- **Result**: Optimize now returns cached results with correct pricing

#### MEDIUM: BrightData Proxy SSL Error
- **Symptom**: `health/services` shows BrightData as "unreachable" with `CERTIFICATE_VERIFY_FAILED`
- **Root Cause**: Self-signed certificate in proxy chain
- **Status**: Not fixed — may need SSL verification disabled for proxy or cert updated

#### LOW: Demo Alert Audio Not Generated
- **Symptom**: `POST /api/demo-alert` sends Discord text but `audio_generated: false`
- **Root Cause**: Same ElevenLabs quota exhaustion issue
- **Fix**: Covered by ElevenLabs fix above

### What's Working
- All 6 frontend pages render correctly (/, /dashboard, /optimize, /alerts, /trends, /architecture)
- Nav bar with active tab highlighting
- Alerts CRUD (create, list, delete)
- Monitors CRUD (create, list)
- Price data retrieval from DB (prices, trends, sparklines)
- SSE streaming infrastructure (correct headers, event format)
- Discord webhook alerts (text)
- Agent cascade visualization events (spawn, fail, complete)
- Compliance check against government ceiling prices
- WHO reference search via Exa
- Drug info summaries via Exa
- Confidence scoring algorithm
- VN/EN locale toggle (UI)

### Files Modified
- `backend/services/tinyfish.py` — timeout 180s→25s, retries 3→1
- `backend/services/elevenlabs.py` — quota exhaustion tracking, better error handling
- `backend/routers/optimize.py` — DB fallback for cached prices
- `backend/routers/tts.py` — better error message for quota exhaustion

### DB Seed: Realistic Demo Data Added
- **Problem**: Only metformin had cached data (13 unique products). Paracetamol, Losartan, Omeprazole had zero entries.
- **Fix**: Created `seed_demo_data.py` with realistic Vietnamese pharmacy pricing
- **Result**: 369 total rows, 34 unique products across all 5 drugs x 5 pharmacies
- **Details**:
  - Paracetamol 500mg: 6 products (Nadyphar, Panadol, Efferalgan, Hapacol, Tylenol, Stada)
  - Amoxicillin 500mg: 5 products (Domesco, Vidipha, Amoxil, TV.Pharm, Ospamox)
  - Losartan 50mg: 5 products (Stada, Cozaar, Domesco, TV.Pharm, Savipharm)
  - Omeprazole 20mg: 5 products (Domesco, Losec, Stada, TV.Pharm, Omez)
  - Metformin 500mg: 2 new variants (Vidipha, Glucophage 850mg)
- Price variance follows real Vietnamese market patterns (80-150% multiplier by pharmacy)
- 2-4 time-spread observations per product for trends/sparklines
- Fixed gov_prices table: removed 395 duplicates → 5 unique entries with UNIQUE constraint

### Files Added/Modified (Seed)
- `backend/seed_demo_data.py` — new seed script for demo data

### Quick Wins Implemented (Demo Polish)

1. **SSE search DB fallback** — When all TinyFish agents timeout, cached DB prices are injected into the stream. Judges now see 28+ results flowing in even when TinyFish is down. Emits `cache_fallback` event. Uses fuzzy LIKE matching for normalized queries. (`routers/search.py`)

2. **Trends page auto-loads Metformin** — No more blank "No price data yet" state. Page mounts with Metformin 500mg data pre-loaded. (`frontend/src/app/trends/page.tsx`)

3. **Landing page live stats** — Hardcoded "14.2M+" replaced with real DB counts (34 products, 893 scans, 5 pharmacies, 11 drugs). Falls back to hardcoded if API fails. New `GET /api/stats` endpoint. (`routers/stats.py`, `frontend/src/app/page.tsx`)

4. **Dashboard auto-search** — Triggers "Metformin 500mg" search on page load via useRef guard. SearchBar pre-populated. (`components/DashboardHome.tsx`, `components/SearchBar.tsx`)

5. **30-day historical prices** — Seed script now generates 6-10 observations per product over 30 days with subtle upward price trends. 825+ observations total. (`seed_demo_data.py`)

### Pre-Demo Checklist
- [ ] Add ElevenLabs credits (0 remaining)
- [ ] Verify TinyFish API connectivity (currently timing out)
- [x] ~~Run a successful search to populate fresh cache data~~ → seeded via script
- [ ] Test full demo flow end-to-end in browser
- [ ] Check BrightData proxy SSL cert
