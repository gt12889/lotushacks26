# Sponsor Challenge Audit

**Project**: MegalodonMD — Vietnamese Pharmaceutical Price Intelligence
**Event**: LotusHacks 2026
**Audit Date**: 2026-03-21

---

## Win Likelihood Scores

| # | Challenge | Score | Verdict |
|---|-----------|:-----:|---------|
| 1 | **TinyFish (Enterprise Track)** | **9/10** | Best shot. 5 parallel stealth agents, 3-tier cascade, /run-batch, live browser preview. Exactly what TinyFish wants. Demo-dependent — have cached fallback. |
| 2 | **ElevenLabs (Voice AI)** | **8/10** | Auto-playing Vietnamese voice summary is a wow moment judges remember. Two integration points (search summary + Discord alerts). Differentiator most teams won't have. |
| 3 | **Qwen (Vietnamese NLP)** | **8/10** | Qwen 2.5 72B normalizes Vietnamese drug names with diacritics/typos in the live search pipeline. Perfect domain fit. Demo the "thuoc ha duong huyet" → "Metformin" transformation. |
| 4 | **BrightData (Data Collection)** | **7/10** | Proxy on 3/5 chains, health check, credential masking. Solid but thin — no advanced BrightData features (SERP API, unlocker, dataset marketplace). |
| 5 | **Exa (AI Search)** | **7/10** | 4 distinct use cases: variant discovery, WHO pricing, drug info, counterfeit risk. Caching, graceful degradation. Variant extraction quality could be stronger. |
| 6 | **OpenAI Codex (Best Use)** | **7/10** | GPT-4o vision + function calling for prescription OCR. Structured tool schema works. Not exceptional vs teams with full agentic tool_calls chaining. |
| 7 | **OpenRouter (LLM Routing)** | **6/10** | 2-model pipeline (Qwen + GPT-4o), configurable env vars, fallback chain. Not sophisticated routing — no dynamic selection or cost optimization. |
| 8 | **HRG: IndieHacker** | **6/10** | $7-10B market, 57K pharmacies, 100-300% variance — business case writes itself. Needs dedicated pitch prep (business model canvas, revenue projections) to score higher. |
| 9 | **Trae (IDE)** | **3/10** | Built with Claude Code, not Trae. Free to submit but low-effort without dedicated Trae workflow screenshots. |
| 10 | **Agora (Voice Call)** | **2/10** | Not implemented. Would need real-time voice call for critical alerts — new development. |
| 11 | **Valsea (Career)** | **N/A** | No tech requirement, just apply. |

**Top 3 to prioritize**: TinyFish, ElevenLabs, Qwen

---

## Implementation Status Matrix

| Challenge | Code Exists | Functional | Challenge-Ready | Status |
|-----------|:-----------:|:----------:|:---------------:|--------|
| TinyFish (Primary) | Yes | **Yes** | **Yes** | All fixed — stealth mode, batch endpoint, streaming URLs, production goals, result validation |
| BrightData | Yes | **Yes** | **Yes** | Fixed — proxy on 3 chains, health check, credential masking |
| OpenRouter | Yes | **Yes** | **Yes** | Fixed — Qwen integrated into search pipeline, configurable models, fallback chain |
| Exa | Yes | **Yes** | **Yes** | Fixed — 4 use cases, caching, graceful degradation |
| ElevenLabs | Yes | **Yes** | **Yes** | Fixed — verified voices with fallback, Vietnamese-optimized settings, auto-play voice summary |
| OpenAI Codex | Yes | **Yes** | **Yes** | Fixed — OpenAI SDK with function calling |

---

## 1. TinyFish — Enterprise Track (Primary)

**Role**: Parallel web scraping agents across 5 Vietnamese pharmacy chains
**Status**: PRODUCTION-READY

### What Works
- 5 parallel agents: Long Chau, Pharmacity, An Khang, Than Thien, Medicare
- SSE streaming with typed event handling (STARTED, STREAMING_URL, PROGRESS, COMPLETE)
- `asyncio.gather()` parallel execution for single-drug search
- `/run-batch` atomic multi-drug submission for prescription optimizer (up to 100 runs per request)
- `browser_profile: "stealth"` on all agents (anti-detection for bot-protected sites like Long Chau/FPT)
- BrightData proxy for Long Chau, Pharmacity, An Khang
- Production-grade goal prompts per pharmacy (numbered steps, cookie handling, CAPTCHA detection, JSON schema)
- Result validation: distinguishes infrastructure failure, goal failure, and CAPTCHA detection
- Live browser preview URLs (iframe-embeddable, 24hr validity) surfaced to frontend
- Retry with exponential backoff (3 attempts: 1s, 3s, 5s)
- Robust JSON extraction (`_extract_json_array()` handles markdown fences, balanced brackets)
- Price range validation (1,000–50,000,000 VND)
- Fuzzy drug name matching (0.2 threshold for generics)
- In-memory cache with TTL (15 min) and LRU eviction (200 entries)
- Periodic health checks (5-min interval)

### Issues Resolved (Phase 7 + Phase 8)
| # | Issue | Resolution |
|---|-------|------------|
| 1 | No retry/backoff logic | ✅ 3-attempt retry with 1s/3s/5s delays |
| 2 | Brittle JSON parsing | ✅ `_extract_json_array()` with balanced bracket detection |
| 3 | Fuzzy threshold too aggressive | ✅ Lowered to 0.2 |
| 4 | No price validation | ✅ 1,000–50,000,000 VND bounds |
| 5 | No stealth browser profile | ✅ `browser_profile: "stealth"` on all requests |
| 6 | Generic goal prompts (slow, unreliable) | ✅ Per-pharmacy production goals with numbered steps |
| 7 | No COMPLETED vs success validation | ✅ `_validate_tinyfish_result()` with structured error handling |
| 8 | No streaming URL capture | ✅ SSE typed event parsing, `streaming_url` on results |
| 9 | 25 individual calls for optimizer | ✅ `/run-batch` atomic submission with parallel polling |
| 10 | No live browser preview in UI | ✅ `LiveBrowserPreview.tsx` collapsible iframe panel |

### Remaining Known Limitations
- In-memory cache lost on restart (acceptable for hackathon)
- Cannot solve CAPTCHAs (reCAPTCHA, hCaptcha) — returns structured error
- Each browser run starts fresh (no session persistence)

---

## 2. BrightData — Proxy Layer

**Role**: Proxy service for anti-bot protection on pharmacy sites
**Status**: PRODUCTION-READY

### What Works
- Code path exists in `tinyfish.py:253-258` to inject `proxy-config` into TinyFish requests
- Proxy URL stored as environment variable (not hardcoded)
- Applied to Long Chau, Pharmacity, and An Khang (the three largest chains with anti-bot protection)

### Issues Resolved (Phase 7)
| # | Issue | Resolution |
|---|-------|------------|
| 1 | `BRIGHTDATA_PROXY_URL` missing from `.env` | ✅ Added to `.env` and `.env.example` |
| 2 | Only Long Chau got proxy | ✅ Extended to Pharmacity and An Khang (`tinyfish.py` checks `source_id in ("long_chau", "pharmacity", "an_khang")`) |
| 3 | No proxy URL validation | ✅ Added validation |
| 4 | No proxy health check | ✅ Added to `services/health.py` |
| 5 | Generic exception handling | ✅ Improved with proxy-specific error handling |
| 6 | No proxy-specific logging | ✅ Added activation/failure logging |
| 7 | Proxy credentials may leak in error messages | ✅ Credential masking in logs |

---

## 3. OpenRouter — LLM Routing for Multi-Model Architecture

**Role**: Route LLM requests across multiple models for OCR and text normalization
**Status**: PRODUCTION-READY

### What Works
- OCR service (`services/ocr.py`) calls GPT-4o via OpenRouter for prescription image analysis
- Qwen service (`services/qwen.py`) integrated into search pipeline for Vietnamese drug name normalization
- API key properly loaded from environment
- Model names configurable via env vars (`OPENROUTER_OCR_MODEL`, `OPENROUTER_NORMALIZATION_MODEL`, `OPENROUTER_FALLBACK_MODEL`)
- Model fallback chain (primary → Claude Sonnet fallback)
- OpenRouter included in health check endpoint
- OCR connected to optimizer via `/api/optimize/prescription`

### Models Used
| Service | Model | Configurable |
|---------|-------|:------------:|
| OCR | `openai/gpt-4o` | Yes (env var) |
| Normalization | `qwen/qwen-2.5-72b-instruct` | Yes (env var) |
| Fallback | `anthropic/claude-sonnet-4-20250514` | Yes (env var) |

### Issues Resolved (Phase 7)
| # | Issue | Resolution |
|---|-------|------------|
| 1 | Qwen service was dead code | ✅ Integrated into search pipeline — every query normalized before TinyFish dispatch |
| 2 | OCR disconnected from optimizer | ✅ New `/api/optimize/prescription` endpoint chains OCR → optimize |
| 3 | No model selection logic | ✅ Configurable models via env vars with fallback chain |
| 4 | No fallback models | ✅ Claude Sonnet as fallback |
| 5 | No OpenRouter health check | ✅ Added to `services/health.py` |
| 6 | Brittle JSON parsing | ✅ Robust extraction with markdown fence stripping |

---

## 4. Exa — Semantic Drug Discovery

**Role**: Semantic search for drug variants and generic alternatives
**Status**: PRODUCTION-READY

### What Works
- **4 distinct Exa use cases**:
  1. **Tier 2 variant discovery** — finds generic alternatives (e.g., Metformin → Glucophage, Metformin Stada)
  2. **WHO reference pricing** — international price benchmarks via `category: "research paper"` search
  3. **Drug info cards** — indications, side effects, dosage via `summary: true`
  4. **Counterfeit risk research** — deep research on anomalously cheap products
- Well-integrated into search pipeline (non-blocking, parallel)
- Graceful degradation: local variants + brand mappings work if Exa fails
- Combined with local heuristics in `variants.py` (brand-to-generic map, Vietnamese manufacturers)
- Tracked as `AgentTier.VARIANT` with proper lineage
- 1-hour TTL caching per drug name
- Exa included in health check endpoint

### Issues Resolved (Phase 7)
| # | Issue | Resolution |
|---|-------|------------|
| 1 | `EXA_API_KEY` missing from `.env` | ✅ Added to `.env` and `.env.example` |
| 2 | Fragile variant extraction | ✅ Improved with regex-based drug name matching |
| 3 | No caching | ✅ 1-hour TTL cache per drug name |
| 4 | No Exa health check | ✅ Added to `services/health.py` |
| 5 | Silent failures | ✅ Improved error handling and logging |

---

## 5. ElevenLabs — Vietnamese Voice Alerts

**Role**: Generate Vietnamese voice audio for price change alerts on Discord + post-search voice summary
**Status**: PRODUCTION-READY

### What Works
- **Two integration points**:
  1. **Discord voice alerts** — monitor detects price change → generate Vietnamese audio → attach to Discord webhook
  2. **Post-search voice summary** — `POST /api/tts/summary` generates Vietnamese summary, auto-played on dashboard via `VoiceSummary.tsx`
- Uses `eleven_multilingual_v2` model (supports Vietnamese)
- Vietnamese-optimized voice settings: stability 0.65, similarity_boost 0.80, style 0.15, speaker_boost enabled
- Verified voice IDs: Sarah (primary) + Rachel (fallback) — both confirmed working with Vietnamese
- Voice fallback chain: try Sarah → try Rachel → graceful text-only fallback
- Summary template: *"Metformin 500mg, giá rẻ nhất tại Long Châu, 45.000 đồng, tiết kiệm 90.000 đồng so với nơi đắt nhất."*
- ElevenLabs sponsor badge visible during playback on dashboard
- Text truncated to 250 chars to conserve API credits

### Issues Resolved (Phase 7)
| # | Issue | Resolution |
|---|-------|------------|
| 1 | API key in `.env` (not committed to git) | ✅ `.env` in `.gitignore`, key rotated |
| 2 | Unverified voice ID | ✅ Sarah + Rachel verified, fallback chain |
| 3 | Hardcoded voice ID | ✅ Two voices with automatic fallback |
| 4 | Voice settings not optimized for Vietnamese | ✅ Tuned: stability 0.65, similarity 0.80 for tonal accuracy |
| 5 | No retry logic | ✅ Fallback voice chain (2 voices before giving up) |
| 6 | Generic exception handling | ✅ Distinguishes quota exceeded vs auth error vs network failure |

---

## 6. OpenAI: Best Use of Codex — GPT-4V Prescription OCR + Function Calling

**Role**: Extract drug names from prescription images using vision + structured function calling
**Status**: PRODUCTION-READY

### What Works
- Prescription OCR pipeline works end-to-end (image upload → drug extraction → optimize)
- Frontend has file upload UI on `/optimize` page
- OpenAI SDK (`openai>=1.0.0`) installed with `AsyncOpenAI` client
- **Function calling** with `extract_prescription_drugs` tool schema (name, dosage, frequency, quantity)
- Direct OpenAI API key (`OPENAI_API_KEY`) for Codex challenge compliance
- GPT-4o vision with base64 image encoding
- Structured `tool_calls` response parsing — no string slicing
- Connected to optimizer via `/api/optimize/prescription` (OCR → drug extraction → multi-pharmacy search)

### Issues Resolved (Phase 7)
| # | Issue | Resolution |
|---|-------|------------|
| 1 | No OpenAI SDK installed | ✅ `openai>=1.0.0` in requirements.txt, `AsyncOpenAI` client |
| 2 | No function calling | ✅ `tools` parameter with `extract_prescription_drugs` schema (4 fields) |
| 3 | Routed through OpenRouter, not OpenAI | ✅ Direct `OPENAI_API_KEY` added for Codex challenge |
| 4 | JSON extraction via string slicing | ✅ Structured `tool_calls[0].function.arguments` parsing |
| 5 | OCR disconnected from optimizer | ✅ `/api/optimize/prescription` chains OCR → optimize |

---

## Demo-Day Priorities

All sponsor challenges are now PRODUCTION-READY. Focus for demo day:

1. **TinyFish (9/10)** — Rehearse live search demo. Have cached fallback data if pharmacy sites block. Show live browser preview iframes.
2. **ElevenLabs (8/10)** — Test API credit balance. Ensure voice summary auto-plays smoothly. Have speaker volume ready.
3. **Qwen (8/10)** — Prepare a Vietnamese typo example ("thuoc ha duong huyet" → "Metformin") to demo normalization live.
4. **Exa (7/10)** — Show variant discovery finding a non-obvious generic alternative.
5. **OpenAI Codex (7/10)** — Have a prescription image ready for OCR demo on `/optimize`.
6. **BrightData (7/10)** — Mention proxy integration during TinyFish demo (natural synergy).
7. **OpenRouter (6/10)** — Point to Model Router Panel during search showing multi-model pipeline.
8. **IndieHacker (6/10)** — Prepare 1-page business pitch: $7-10B market, SaaS pricing, hospital procurement customers.
