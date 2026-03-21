# Sponsor Challenge Audit

**Project**: MediScrape — Vietnamese Pharmaceutical Price Intelligence
**Event**: LotusHacks 2026
**Audit Date**: 2026-03-21

---

## Summary Matrix

| Challenge | Code Exists | Functional | Challenge-Ready | Blocking Issue |
|-----------|:-----------:|:----------:|:---------------:|----------------|
| TinyFish (Primary) | Yes | Yes | Needs hardening | No retry logic, brittle JSON parsing |
| BrightData | Yes | **No** | No | `BRIGHTDATA_PROXY_URL` missing from `.env` |
| OpenRouter | Partial | **Partial** | No | Qwen service is dead code; no routing logic |
| Exa | Yes | **No** | No | `EXA_API_KEY` missing from `.env` |
| ElevenLabs | Yes | **No** | No | Unverified voice ID; API key committed in plaintext |
| OpenAI Codex | Yes | **Partial** | **No** | Wrong API (OpenRouter, not OpenAI SDK); no function calling |

---

## 1. TinyFish — Enterprise Track (Primary)

**Role**: Parallel web scraping agents across 5 Vietnamese pharmacy chains
**Status**: FUNCTIONAL, NEEDS HARDENING

### What Works
- 5 parallel agents confirmed: Long Chau, Pharmacity, An Khang, Than Thien, Medicare
- SSE streaming properly implemented with correct `data:` format
- `asyncio.gather()` parallel execution
- API key loaded from config, passed via `X-API-Key` header
- BrightData proxy conditional support for Long Chau
- Periodic health checks (5-min interval)
- In-memory cache with TTL (15 min) and LRU eviction

### Critical Issues
| # | Issue | File | Line(s) | Impact |
|---|-------|------|---------|--------|
| 1 | No retry/backoff logic | `services/tinyfish.py` | 177-204 | Single failure = permanent failure for that pharmacy |
| 2 | Brittle JSON parsing via `content.index("[")` | `services/tinyfish.py` | 299-303 | Breaks on malformed TinyFish responses |
| 3 | Fuzzy match threshold (0.3) too aggressive | `services/tinyfish.py` | 315 | Filters valid results (e.g., generics with different brand names) |
| 4 | No price sanity validation | `services/tinyfish.py` | 318-320 | Accepts any int > 0; no max bound, no currency check |
| 5 | Timeout comment says 120s, code uses 180s | `services/tinyfish.py` | 174, 183 | Misleading; debug confusion |

### Medium Issues
| # | Issue | File | Impact |
|---|-------|------|--------|
| 6 | In-memory cache lost on restart | `services/tinyfish.py` | No persistence across deploys |
| 7 | Insufficient error logging (no product context) | `services/tinyfish.py:337` | Can't debug TinyFish output quality |
| 8 | Health check sends dummy request to `example.com` | `services/health.py` | Wastes credits; doesn't validate real pharmacy scraping |
| 9 | Timeout metric set to timeout value, not elapsed time | `services/tinyfish.py:195` | Misleading response_time_ms on errors |
| 10 | Mock data only covers 4 drugs | `services/tinyfish.py:166-171` | Other queries get metformin prices in dev mode |
| 11 | No product deduplication across sources | `routers/search.py:102` | Same product appears 5× from 5 pharmacies |

### Recommendations
1. Add retry with exponential backoff (3 attempts, 1-5s delays)
2. Replace string-slicing JSON extraction with proper decoder
3. Raise fuzzy threshold to 0.5 or use phonetic matching for Vietnamese
4. Add price range validation (1,000–50,000,000 VND)
5. Implement Redis or SQLite-backed cache

---

## 2. BrightData — Proxy Layer

**Role**: Proxy service for anti-bot protection on pharmacy sites
**Status**: NON-FUNCTIONAL

### What Works
- Code path exists in `tinyfish.py:253-258` to inject `proxy-config` into TinyFish requests
- Proxy URL stored as environment variable (not hardcoded)
- Conditional: only applied to Long Chau (largest chain, most blocking)

### Critical Issues
| # | Issue | File | Impact |
|---|-------|------|--------|
| 1 | **`BRIGHTDATA_PROXY_URL` missing from `.env`** | `.env` | Feature entirely non-functional |
| 2 | Only Long Chau gets proxy | `services/tinyfish.py:253` | Pharmacity (957 stores) and An Khang (527 stores) unprotected |
| 3 | No proxy URL validation | `services/tinyfish.py:254` | Invalid URLs silently passed to TinyFish |
| 4 | No proxy health check | `services/health.py` | Proxy failures discovered only at request time |
| 5 | Generic exception handling | `services/tinyfish.py:353` | Can't distinguish proxy failures from scraping errors |
| 6 | No proxy-specific logging | — | Impossible to verify proxy was used |
| 7 | Proxy credentials may leak in error messages | `services/tinyfish.py:353` | URL with embedded auth logged as plaintext |

### Recommendations
1. Add `BRIGHTDATA_PROXY_URL` to `.env` with real or documented placeholder
2. Extend proxy to Pharmacity and An Khang
3. Add proxy reachability test to health check
4. Log proxy activation/failure (mask credentials)
5. Validate proxy URL format at config load time

---

## 3. OpenRouter — LLM Routing for Multi-Model Architecture

**Role**: Route LLM requests across multiple models for OCR and text normalization
**Status**: PARTIALLY FUNCTIONAL, CLAIMS OVERSTATED

### What Works
- OCR service (`services/ocr.py`) calls GPT-4o via OpenRouter for prescription image analysis
- Qwen service (`services/qwen.py`) written for Vietnamese text normalization
- API key properly loaded from environment

### Critical Issues
| # | Issue | File | Impact |
|---|-------|------|--------|
| 1 | **Qwen service is dead code** — imported/called nowhere | `services/qwen.py` | Entire module orphaned |
| 2 | **OCR disconnected from optimizer** — `/api/ocr` works standalone but optimizer requires manual drug list | `routers/optimize.py` | No image-to-optimization pipeline |
| 3 | Zero model selection/routing logic | `services/ocr.py`, `services/qwen.py` | Two hardcoded models ≠ "multi-model architecture" |
| 4 | No fallback models | — | If GPT-4o fails, no alternative |
| 5 | No OpenRouter health check | `services/health.py` | Silent failures |
| 6 | Brittle JSON parsing (same `index("[")` pattern) | `services/ocr.py:59`, `services/qwen.py:86` | Breaks on malformed LLM output |

### Models Used
| Service | Model | File:Line | Configurable |
|---------|-------|-----------|:------------:|
| OCR | `openai/gpt-4o` | `ocr.py:25` | No |
| Qwen | `qwen/qwen-2.5-72b-instruct` | `qwen.py:21,63` | No |

### Recommendations
1. Integrate Qwen into search pipeline (normalize queries + product names)
2. Connect OCR output → optimizer input
3. Move model names to `config.py` environment variables
4. Add model fallback chain (e.g., GPT-4o → Claude → Qwen)
5. Add OpenRouter to health check endpoint

---

## 4. Exa — Semantic Drug Discovery

**Role**: Semantic search for drug variants and generic alternatives
**Status**: ARCHITECTURALLY SOUND, OPERATIONALLY BROKEN

### What Works
- Well-integrated into Tier 2 search pipeline (non-blocking, background task)
- Graceful degradation: local variants + brand mappings work if Exa fails
- Combined with local heuristics in `variants.py` (brand-to-generic map, Vietnamese manufacturers)
- Tracked as `AgentTier.VARIANT` with proper lineage

### Critical Issues
| # | Issue | File | Impact |
|---|-------|------|--------|
| 1 | **`EXA_API_KEY` missing from `.env`** | `.env` | Feature entirely non-functional |
| 2 | Fragile variant extraction (capitalized words >3 chars only) | `services/exa.py:42-44` | Misses lowercase generics; extracts non-drug words |
| 3 | Query doesn't leverage existing `VN_MANUFACTURERS` mappings | `services/exa.py:16` | Misses pharmacy-specific context |
| 4 | Silent failure indistinguishable from "no variants found" | `services/exa.py:48-50` | Users can't tell if Exa failed vs. nothing exists |
| 5 | No caching of results | `services/exa.py` | Same drug re-queried hits API repeatedly |
| 6 | No Exa health check | `services/health.py` | Failures undetected |
| 7 | `text` field read but never used for extraction | `services/exa.py:40` | Wastes useful data |

### Query Quality
```python
query = f"Vietnamese pharmacy generic alternative for {drug_name} thuốc thay thế"
```
- Mixes English + Vietnamese without language detection
- No dosage context passed
- No therapeutic class included
- Over-qualified: may miss non-generic alternatives

### Recommendations
1. Add `EXA_API_KEY` to `.env`
2. Improve variant extraction (use NER or regex for drug names, not just capitalization)
3. Pass dosage and manufacturer context to Exa query
4. Cache Exa results per drug name
5. Return error status separately from empty results

---

## 5. ElevenLabs — Vietnamese Voice Alerts

**Role**: Generate Vietnamese voice audio for price change alerts on Discord
**Status**: NON-FUNCTIONAL + SECURITY ISSUE

### What Works
- Integration path exists: monitor detects price change → generate audio → send to Discord
- Uses `eleven_multilingual_v2` model (supports Vietnamese)
- Graceful fallback: text-only alert if audio generation fails

### Critical Issues
| # | Issue | File | Impact |
|---|-------|------|--------|
| 1 | **API key committed to `.env` in plaintext** | `.env` | **Security breach** — key exposed in repo |
| 2 | Voice ID `pFZP5JQG7iQjIQuC4Bku` unverified | `services/elevenlabs.py:8` | Likely invalid; calls will fail |
| 3 | Hardcoded voice ID, not configurable | `services/elevenlabs.py:8` | Can't switch voices without code change |
| 4 | Voice settings not optimized for Vietnamese | `services/elevenlabs.py:23-26` | `stability: 0.5`, `similarity_boost: 0.75` are defaults, not tuned |
| 5 | Silent failure → text-only alert without notification | `routers/monitor.py:69-74` | Users never know audio generation failed |
| 6 | No retry logic | `services/elevenlabs.py:36` | Single attempt, 30s timeout |
| 7 | Generic exception handling | `services/elevenlabs.py:36-38` | Can't distinguish auth error vs. network vs. invalid voice |

### Recommendations
1. **Rotate the exposed API key immediately**
2. Move API key to secrets manager or `.env` excluded from git
3. Verify voice ID against ElevenLabs API (list available voices)
4. Make voice ID configurable via environment variable
5. Log audio generation failures as warnings visible to end users
6. Test Vietnamese pronunciation quality with sample phrases

---

## 6. OpenAI: Best Use of Codex — GPT-4V Prescription OCR + Function Calling

**Role**: Extract drug names from prescription images using vision + structured function calling
**Status**: DOES NOT QUALIFY FOR CHALLENGE

### What Works
- Prescription OCR pipeline works end-to-end (image upload → drug extraction → display)
- Frontend has file upload UI on `/optimize` page
- Base64 image encoding and vision prompt implemented
- Returns structured `{"drugs": [...], "count": N}` response

### Critical Issues — Challenge Disqualification
| # | Issue | File | Impact |
|---|-------|------|--------|
| 1 | **No OpenAI SDK installed** — uses raw `httpx` | `requirements.txt` | Challenge requires OpenAI SDK patterns |
| 2 | **No function calling** — pure text prompt | `services/ocr.py:28-35` | Challenge explicitly requires function calling |
| 3 | **Routes through OpenRouter, not OpenAI API** | `services/ocr.py:9` | `openai/gpt-4o` is OpenRouter namespace, not direct |
| 4 | **Config uses `OPENROUTER_API_KEY`** | `config.py` | Should be `OPENAI_API_KEY` for challenge |
| 5 | JSON extraction via string slicing | `services/ocr.py:59-68` | Function calling would return structured data natively |

### Current vs Required

| Aspect | Current | Required for Challenge |
|--------|---------|----------------------|
| SDK | `httpx` raw requests | `openai` Python SDK |
| Auth | OpenRouter API key | OpenAI API key |
| Model | `"openai/gpt-4o"` via OpenRouter | Direct OpenAI `gpt-4o` / `gpt-4-vision-preview` |
| Extraction | Text prompt → manual JSON parse | `tools=[{"type": "function", ...}]` → `tool_calls` response |
| Response | String with `[` `]` bracket search | Structured `message.tool_calls[0].function.arguments` |

### To Qualify
```python
# 1. Install SDK
pip install openai>=1.0.0

# 2. Use function calling
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=openai_key)
response = await client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": [
        {"type": "text", "text": "Extract drugs from this prescription"},
        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}}
    ]}],
    tools=[{
        "type": "function",
        "function": {
            "name": "extract_prescription_drugs",
            "description": "Extract medication names and dosages from a prescription image",
            "parameters": {
                "type": "object",
                "properties": {
                    "drugs": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "dosage": {"type": "string"},
                                "frequency": {"type": "string"}
                            },
                            "required": ["name"]
                        }
                    }
                },
                "required": ["drugs"]
            }
        }
    }],
    tool_choice={"type": "function", "function": {"name": "extract_prescription_drugs"}}
)
```

### Recommendations
1. Install `openai` SDK and add direct OpenAI API key
2. Implement function calling with structured tool schema
3. Keep OpenRouter as fallback; add OpenAI as primary for Codex challenge
4. Parse `tool_calls` response instead of string slicing
5. Add dosage, frequency, and quantity to extraction schema

---

## Priority Fix Order

1. **Security**: Rotate exposed ElevenLabs API key
2. **Env vars**: Add `BRIGHTDATA_PROXY_URL` and `EXA_API_KEY` to `.env`
3. **Codex challenge**: Install OpenAI SDK, implement function calling
4. **OpenRouter**: Integrate Qwen service, connect OCR → optimizer
5. **TinyFish**: Add retry logic, fix JSON parsing
6. **ElevenLabs**: Verify/replace voice ID
7. **Exa**: Improve variant extraction heuristics
8. **BrightData**: Extend proxy to more pharmacies
