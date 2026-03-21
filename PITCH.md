# MegalodonMD

### AI-Powered Pharmaceutical Price Intelligence for Vietnam

**LotusHacks 2026 | Enterprise Track**

---

## The Problem

Vietnam has **57,000+ pharmacies** and **zero unified pricing infrastructure**. The same medication can vary **100-300% in price** across pharmacy chains. Hospital procurement teams, clinic managers, and insurance analysts have no way to compare prices in real time.

- **$7-10B+ pharmaceutical market**, growing 15%+ annually
- **1,192 public hospitals** sourcing medications blindly
- Drug prices documented at up to **47x international reference prices**
- No pharmacy chain exposes a public API

**This is a data access problem that only AI web agents can solve.**

---

## The Solution

MegalodonMD deploys **5 parallel TinyFish stealth agents** across Vietnam's largest pharmacy chains simultaneously, returning unified, structured drug pricing data in real time via SSE streaming.

**One-liner:** *"We turn every pharmacy website in Vietnam into a queryable, real-time pricing API using parallel AI web agents."*

---

## What Makes This Different

### 4-Tier Agent Cascade (No Other Team Has This)

| Tier | Agent | What It Does |
|------|-------|-------------|
| **Tier 0** | GPT-4o Vision + Function Calling | Extracts drug names from prescription photos (OCR) |
| **Tier 1** | 5 Parallel TinyFish Agents | Navigate 5 pharmacy websites simultaneously in stealth mode |
| **Tier 2** | Exa Semantic Search | Discovers generic alternatives (Metformin -> Glucophage, Metformin Stada) |
| **Tier 3** | Scout-Spawn TinyFish Agents | Dynamically spawns NEW agents for each discovered variant across successful pharmacies |
| **Tier 4** | Qwen 2.5 72B Analyst | Cross-validates all results, generates confidence score (0-100) and Vietnamese action directive |

**Tier 3 is the killer feature**: the system discovers drugs it didn't know about at runtime, then autonomously deploys new agents to search for them. This is dynamic agent spawning from runtime discoveries — the exact capability TinyFish was built for.

### Live Browser Preview

Every TinyFish run emits a **STREAMING_URL** — an iframe-embeddable live view of the agent navigating pharmacy websites. Judges can **watch the AI clicking through Long Chau in real time** next to the price results. No other team at LotusHacks will have this.

### Vietnamese Voice Summary

After every search, ElevenLabs auto-plays a Vietnamese TTS summary: *"Metformin 500mg, gia re nhat tai Long Chau, 45.000 dong, tiet kiem 90.000 dong so voi noi dat nhat."* This is memorable, accessible, and demonstrates real-world utility.

### Enterprise-Grade Safety

We don't just find the cheapest price — we find the **safest cheapest price**:
- **Price anomaly detection**: Statistical outlier flagging (>2 SD = "suspiciously low" for potential counterfeit/near-expiry)
- **Government ceiling compliance**: Cross-reference against Vietnam's DAV declared prices
- **WHO reference pricing**: International benchmark badges showing how Vietnamese prices compare globally
- **Counterfeit risk research**: Exa deep search for counterfeit intelligence on anomalous products
- **Confidence scoring**: 5-signal weighted score (source agreement, price convergence, compliance, anomaly-free, variant coverage)

---

## Technical Architecture

```
User Query
    |
    v
Qwen 2.5 72B (Vietnamese drug name normalization)
    |
    v
5 Parallel TinyFish Stealth Agents -----> Live Browser Preview (iframe)
  | Long Chau  [stealth + BrightData proxy]
  | Pharmacity [stealth + BrightData proxy]
  | An Khang   [stealth + BrightData proxy]
  | Than Thien [stealth]
  | Medicare   [stealth]
    |
    v  SSE Streaming (23 event types)
    |
    v
Exa Variant Discovery ---> Scout-Spawn NEW TinyFish Agents (Tier 3)
    |
    v
Analyst Verdict (Qwen 2.5 72B) ---> Confidence Score + Vietnamese Action Label
    |
    v
Dashboard: Price Grid | Savings Banner | Anomaly Badges | WHO Pricing | Voice Summary
```

**Backend**: FastAPI + asyncio + SQLite (WAL) + APScheduler
**Frontend**: Next.js 16 + React 19 + Tailwind CSS v4 + shadcn/ui + Recharts

---

## Sponsor Challenge Integrations

### TinyFish — Enterprise Track (Primary)

**5 parallel stealth web agents** across Vietnam's top pharmacy chains. Production-grade goal prompts with numbered steps, CAPTCHA detection, cookie handling, and Vietnamese edge cases. Atomic `/run-batch` endpoint for prescription optimizer (up to 100 runs in one POST). Live browser preview via STREAMING_URL. Retry with exponential backoff. This is the deepest possible integration of TinyFish's capabilities.

**Key differentiator**: Dynamic Tier 3 scout-spawn — agents that discover new drugs at runtime and autonomously deploy new agents to find them.

---

### BrightData — Data Collection

Proxy layer on the 3 largest chains (Long Chau, Pharmacity, An Khang) with `-country-vn` geo-targeting. Anti-bot bypass for FPT-owned sites. Health check endpoint, credential masking in logs, URL validation at config time.

---

### OpenRouter — LLM Integration

Multi-model AI orchestration:
- **Qwen 2.5 72B** for Vietnamese drug name normalization (handles diacritics, typos, slang)
- **GPT-4o** for prescription OCR with structured function calling
- **NL multi-drug search**: Parse "I need diabetes and blood pressure medications" into specific drug searches, dispatch parallel agents, synthesize AI procurement recommendation
- Configurable models via environment variables with automatic fallback chain
- **This demonstrates AI orchestration on top of AI agents** — a level of technical depth most teams won't reach

---

### Exa — AI Search

**5 distinct use cases** (more than any other team):
1. **Variant discovery** — find generic alternatives to searched drugs
2. **WHO reference pricing** — international benchmark badges with multiplier comparison
3. **Drug info cards** — indications, side effects, dosage summaries
4. **Counterfeit risk research** — deep search on anomalously cheap products
5. **Scout-spawn triggers** — discovered variants feed back into Tier 3 agent spawning

Caching (1hr TTL), graceful degradation to local variant maps, tracked as `AgentTier.VARIANT`.

---

### ElevenLabs — Voice AI

**Two integration points**:
1. **Post-search voice summary** — Vietnamese TTS auto-plays on dashboard after every search. Uses `eleven_multilingual_v2` with Vietnamese-optimized settings (stability 0.65, similarity 0.80). Voice fallback chain (Sarah -> Rachel -> text-only).
2. **Discord voice alerts** — When price monitors detect changes, generate Vietnamese audio and attach to Discord webhook notifications.

**This wins the ElevenLabs sponsor prize**: 6 months Scale tier per team member ($330/month value each).

---

### OpenAI — Best Use of Codex

Prescription OCR pipeline: upload photo -> GPT-4o Vision analyzes the image -> `extract_prescription_drugs` function calling tool schema extracts structured drug data (name, dosage, frequency, quantity) -> feeds into multi-pharmacy optimizer. Uses `AsyncOpenAI` SDK directly (not routed through OpenRouter) for Codex challenge compliance.

---

### Qwen — Vietnamese NLP

Qwen 2.5 72B normalizes every search query before agent dispatch. Handles:
- Vietnamese diacritics: "thuoc ha duong huyet" -> "Metformin"
- Typos and informal names
- Brand-to-generic mapping
- Returns structured JSON with `generic_name`, `brand_names`, `active_ingredient`

This runs in the critical path of every single search — not a bolt-on feature.

---

### Supermemory — Cross-Session Context

Search history and user preferences persisted across sessions via Supermemory API. Powers personalized shopping insights: "You searched for Metformin 3 times this week. Prices have dropped 12% at Long Chau since your first search."

---

## Key Metrics

| Metric | Value |
|--------|-------|
| Pharmacy chains scraped simultaneously | 5 |
| Total pharmacy stores covered | 3,751+ |
| Agent tiers in cascade | 4 (OCR -> Search -> Variant -> Analyst) |
| SSE event types | 23 |
| Sponsor integrations | 9 (TinyFish, BrightData, OpenRouter, Exa, ElevenLabs, OpenAI, Qwen, Discord, Supermemory) |
| Exa use cases | 5 |
| Frontend routes | 6 |
| React components | 27+ |
| API endpoints | 20+ |
| Confidence scoring signals | 5 (weighted 0-100) |
| Languages supported | Vietnamese + English (full i18n) |

---

## Demo Flow (5 Minutes)

### 0:00-0:30 | The Problem
"Same Metformin costs 45,000 VND here, 135,000 VND there. 57,000 pharmacies. No unified pricing. Hospital procurement is flying blind."

### 0:30-2:00 | Live Search Demo
- Type "Metformin 500mg" (or use Vietnamese voice input)
- Watch **Agent Activity Feed** log 25+ agent events in real time
- **5 pharmacy cards glow** as results stream in via SSE
- **Live Browser Preview** shows TinyFish navigating Long Chau
- **Metrics Bar** ticks up: agents deployed, pharmacies scanned, products found
- **Agent Cascade** shows Tier 1 -> Tier 2 -> Tier 3 progression
- **Model Router** shows Qwen -> TinyFish -> Exa pipeline with latency
- **Savings Banner**: "Save 340,000 VND (47%)"
- **Anomaly badges**: red "suspiciously low", green "best value"
- **WHO Reference**: "3.7x international benchmark"
- **Government Ceiling Panel** flags DAV violations
- **Vietnamese voice summary auto-plays** via ElevenLabs

### 2:00-2:30 | Prescription OCR
Upload prescription photo on Optimize page. GPT-4o extracts drugs. Watch 50+ agents spawn for multi-drug optimization. Comparison matrix shows optimal sourcing.

### 2:30-3:00 | NL Multi-Drug Search
Type: "I need diabetes and blood pressure medications for a clinic, generic preferred." OpenRouter parses into Metformin + Amlodipine + Losartan. Parallel agent dispatch. AI procurement recommendation.

### 3:00-3:30 | Discord Alert Demo
Fire demo alert button. Discord webhook + Vietnamese voice note plays from phone speaker. Shows real-time notification capability.

### 3:30-4:00 | Architecture Tour
Navigate to Architecture page. 3-column flow diagram crediting every sponsor integration. Show the technical depth.

### 4:00-5:00 | Enterprise Impact + Q&A
- $7-10B+ pharmaceutical market
- 1,192 public hospitals as target customers
- SaaS model: per-query pricing for procurement departments
- Regional expansion: Thailand, Philippines, Indonesia
- "We built the Bloomberg Terminal for pharmaceutical procurement in Southeast Asia"

---

## Design System: "The Abyss"

Deep-ocean cyberpunk-pharmaceutical aesthetic. Dark navy backgrounds, cyan accents, bioluminescent glow effects. Data-dense, monospace-heavy. Bloomberg Terminal meets deep-sea exploration.

- **shadcn/ui** component foundation with custom Abyss theme
- **Animated counters** on metrics (count-up on value change)
- **macOS Dock navigation** with magnification hover effect
- **Glare hover effects** on pharmacy cards
- **Aurora canvas background** on landing page with ocean video layer
- **Scroll-reveal animations** on landing page sections
- **Terminal-style agent feed** with animated list entries
- **Bioluminescent glassmorphism** cards with per-pharmacy glow colors
- **Sonar pulse dots** on active agent status indicators

---

## Why We Win

1. **Deepest TinyFish integration at the hackathon** — 5 parallel stealth agents, 4-tier cascade with dynamic scout-spawn, live browser preview, atomic batch endpoint
2. **9 sponsor integrations** — more than any other team, each one substantive (not bolt-on)
3. **Real enterprise problem** — $7B+ market, 57K pharmacies, documented 100-300% price variance
4. **Safety-first framing** — not just "find cheapest" but "find safest cheapest" with anomaly detection, compliance checking, and confidence scoring
5. **Vietnamese-first** — voice input, voice output, full i18n, Qwen normalization for Vietnamese drug names
6. **Production-grade engineering** — retry logic, caching, fallback chains, health checks, error handling, SSE streaming with 23 event types
7. **The demo sells itself** — watching AI agents navigate pharmacy websites in real time is viscerally compelling
