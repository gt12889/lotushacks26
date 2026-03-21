# Lessons Learned — LotusHacks 2026 (Megladon MD)

## 2026-03-21 — Sponsor Challenge Audit & Demo Feature Build

### Lesson 1: "Compiles" ≠ "Works"
- 4 new frontend components (AgentActivityFeed, LiveMetricsBar, SponsorBadge, DemoAlertTrigger) passed TypeScript and production build but were **never browser-tested**.
- Backend endpoints were runtime-tested with curl — confirmed working.
- **Rule**: Always do a runtime test for both backend (curl) AND frontend (open in browser) before claiming done.

### Lesson 2: Missing env vars silently disable entire sponsor integrations
- `BRIGHTDATA_PROXY_URL` and `EXA_API_KEY` were absent from `.env` — made two sponsor challenges completely non-functional with zero errors or warnings.
- **Rule**: Validate required env vars at app startup and log warnings. Add all vars to `.env.example` with comments.

### Lesson 3: Dead code goes unnoticed
- `services/qwen.py` existed with two complete functions but was imported nowhere. Entire OpenRouter "multi-model architecture" claim was based on two hardcoded models with no routing.
- **Rule**: After writing a service, grep for its imports. If nothing calls it, it's dead.

### Lesson 4: "Uses OpenRouter" ≠ "Qualifies for OpenAI Codex challenge"
- OCR routed through OpenRouter with raw httpx, not OpenAI SDK. No function calling. Challenge explicitly required both.
- **Rule**: Read sponsor challenge requirements literally. "Best use of Codex" means OpenAI SDK + function calling, not "any model that happens to be GPT-4o via a proxy."

### Lesson 5: API keys expire/deplete without warning
- ElevenLabs API key was valid but quota-exceeded — voice notes silently return None, alert falls back to text-only without telling the user.
- TinyFish API key returning 403 — either expired or rate-limited.
- **Rule**: Health check endpoints should verify API keys have working quota, not just that the service is reachable. Surface "credits exhausted" distinctly from "auth failed."

### Lesson 6: Security — API keys committed to repos
- ElevenLabs key was in `.env` which was in `.gitignore` and never committed (verified with `git log`). Initial audit flagged it incorrectly as "committed in plaintext."
- **Rule**: Before raising a security alarm, verify with `git log --all -- .env` whether the file was actually committed. `.gitignore` prevents future commits but doesn't retroactively remove history.

### Lesson 7: Linter race conditions during editing
- File edits failed 3 times on `page.tsx` because a linter/watcher was modifying the file between read and write.
- **Rule**: When editing files that are being watched (Next.js dev server, ESLint watch), either stop the watcher or read immediately before each edit. Don't batch reads and writes.

### Lesson 8: Mock mode masks real integration bugs
- TinyFish mock mode works perfectly (returns canned data for 4 drugs). Real mode returns 403. Mock mode can't test BrightData proxy, SSE event types, or error handling paths.
- **Rule**: Always test with real API keys at least once before demo. Mock mode is for development speed, not validation.

### Lesson 9: Demo features have outsized impact per line of code
- SponsorBadge: ~35 lines, makes 6 bounty submissions visible to judges.
- LiveMetricsBar: ~94 lines, transforms static page into "AI platform."
- DemoAlertTrigger: ~112 lines, covers 2 sponsor prizes in one button.
- **Rule**: Prioritize demo-visible features over architectural purity during hackathons.

### Lesson 10: Backend agent events have the right shape, but frontend must map them
- Backend SSE emits `agent_spawn` (type field), frontend `AgentActivityFeed` expects `spawn` (type enum). The mapping in `page.tsx` SSE handler bridges this gap.
- **Rule**: Document the SSE event contract between backend and frontend. Type mismatches are silent failures.

## 2026-03-21 — Runtime Testing Results

### Lesson 11: Qwen normalization broke the search query
- Qwen returned `\`\`\`json\n{"drug":"metformin",...}\n\`\`\`` — the markdown code fence wasn't stripped before JSON parsing. The fallback `len(normalized) < 100` check passed and set the query to the raw markdown block, which got sent to all 5 pharmacy agents.
- **Fix**: Added markdown fence stripping before JSON parse. Removed the plaintext fallback entirely — if parsing fails, keep the original query.
- **Rule**: When an LLM returns JSON, always strip markdown code fences first. Never blindly trust raw output as a search query.

### Lesson 12: TinyFish API key returns 403 but health check shows "connected"
- Health check hit the API and got a non-500 response (403 counts as "connected"). But 403 means the API key is rejected — auth failure, not connectivity.
- Health check already handles `401` as `auth_error` for Exa/OpenRouter, but TinyFish health check doesn't distinguish 403.
- **Rule**: Health checks should treat 401/403 as `auth_error`, not `connected`. A reachable API with a bad key is not "healthy."

### Lesson 13: ElevenLabs quota depleted — voice alerts silently degrade
- `generate_audio()` returns `None` when quota is exceeded. `demo-alert` endpoint correctly falls back to text-only Discord message.
- The response says `"audio_generated": false` but doesn't explain WHY (quota vs. network vs. bad key).
- **Rule**: Surface the specific failure reason (`quota_exceeded`, `auth_error`, `timeout`) in the API response so the demo operator knows what to fix.

### Lesson 14: Demo alert to Discord works — verified live
- `POST /api/demo-alert` returned `{"status":"sent","message":"Alert sent to Discord (text only)"}` — Discord webhook fired successfully.
- Two sponsor prizes (Discord + ElevenLabs) covered by one endpoint. ElevenLabs will work once credits are topped up.

### Lesson 15: Full SSE pipeline verified end-to-end in mock mode
- 10 agents total (5 Tier 1 search + 5 Tier 2 variant discovery)
- All event types fire correctly: `agent_spawn`, `pharmacy_status`, `agent_complete`, `search_complete`
- Summary includes: 8 products, 7 deduplicated, ₫38,000 best price, ₫97,000 savings
- Frontend dev server (`:3001`) and backend (`:8000`) both return HTTP 200
- **Remaining gap**: Frontend components untested in actual browser — need visual confirmation of animations, activity feed scrolling, metrics ticking

## 2026-03-21 — Live TinyFish + BrightData Proxy Testing

### Lesson 16: Vietnamese pharmacies hide prescription drug prices
- Metformin, amoxicillin → ALL pharmacies return "Liên hệ" (contact for price) instead of showing VND prices. This is Vietnamese regulation for prescription drugs.
- Paracetamol (OTC) → prices visible and extracted correctly (₫500/unit from Long Chau).
- **Rule**: Demo must use OTC drugs (paracetamol, vitamin C, vitamin E) for live TinyFish searches. Use mock mode for prescription drugs.

### Lesson 17: TinyFish returns dict-wrapped arrays, not plain arrays
- Goal prompt says "return a JSON array" but TinyFish returns `{"metformin_products": [...]}` or `{"products": [...]}` or `{"result": [...]}`.
- Original `_extract_json_array` only handled `list` and `str` inputs — dict went to `str` path and failed.
- **Fix**: Added dict unwrapping — scan values for the first list. Also handles parsed JSON dicts.
- **Rule**: Never trust an LLM to follow output format exactly. Always handle wrapper objects.

### Lesson 18: BrightData proxy works but needs Vietnam country targeting
- Proxy URL format: `http://brd-customer-{ID}-zone-{ZONE}-country-vn:{PASS}@brd.superproxy.io:33335`
- The `-country-vn` suffix is critical — without it, requests route through non-Vietnam IPs and some pharmacy sites may geo-block.
- Confirmed: `geo.brdtest.com` returns `Country: VN` with the targeting flag.
- Health check shows "unreachable" due to SSL cert issue (self-signed) — cosmetic, doesn't affect TinyFish which handles SSL internally.

### Lesson 19: TinyFish credits ran out on old key, new key works
- Old key `sk-tinyfish-1J2G54...` returned 403 with `"Insufficient credits. You have 0 credits remaining."`
- New key `sk-tinyfish-HC4tSE0...` works — agents connect, navigate sites, extract data.
- Health check returns "connected" for both valid and zero-credit keys (it checks reachability, not quota).
- **Rule**: Health check should distinguish "reachable but no credits" from "reachable and functional."

### Lesson 20: TinyFish agent latency is 30-180s per pharmacy
- Long Chau: 136s to navigate, search, and extract (even with 0 results due to Rx pricing).
- Than Thien: 34s to determine site unreachable.
- Full 5-pharmacy search with 3 retries = potentially 9+ minutes if all timeout.
- **Rule**: For demo, search 1-2 pharmacies live (`sources=long_chau,pharmacity`), not all 5. Or use mock mode for instant results.

### Lesson 21: Exa Research API is async and takes 1-3 minutes
- `exa.research.create()` returns immediately with a `research_id`.
- `poll_until_finished()` blocks — 60s timeout was insufficient, 120s still may not complete.
- SDK uses `research_id` (not `id`) and `timeout_ms` (not `timeout`).
- **Fix**: Moved counterfeit risk research to post-summary SSE event so it doesn't block the main search stream.
- **Rule**: Async APIs need fire-and-forget patterns. Stream results as late events, don't block the main flow.

### Lesson 22: Demo drug selection strategy
| Drug | Type | Live TinyFish | Mock Mode | Ceiling Data | Anomaly Detection |
|------|------|:------------:|:---------:|:------------:|:-----------------:|
| paracetamol | OTC | Prices visible | Yes | Yes (₫500/unit) | No |
| vitamin C | OTC | Likely works | No mock data | No | No |
| metformin | Rx | "Liên hệ" only | Yes (9 products) | Yes (₫1,500/unit) | Yes (fake cheap product) |
| omeprazole | Rx | "Liên hệ" only | Yes (7 products) | Yes (₫2,500/unit) | Yes (fake cheap product) |
| losartan | Rx | "Liên hệ" only | Yes (6 products) | Yes (₫3,000/unit) | No |

**Demo script**: Start with mock mode metformin (shows all features: 25 agents, compliance violations, anomaly detection). Then do a live paracetamol search to show real TinyFish browser agents + BrightData proxy in action.
