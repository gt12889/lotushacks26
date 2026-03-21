# MegalodonMD — Pitch

**AI-Powered Pharmaceutical Price Intelligence for Vietnam**

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

*"We turn every pharmacy website in Vietnam into a queryable, real-time pricing API using parallel AI web agents."*

---

## What Makes This Different

### 5-Tier Agent Cascade

| Tier | Agent | What It Does |
|------|-------|-------------|
| **Tier 0** | GPT-4o Vision + Function Calling | Extracts drug names from prescription photos (OCR) |
| **Tier 1** | 5 Parallel TinyFish Agents | Navigate 5 pharmacy websites simultaneously in stealth mode |
| **Tier 2** | Exa Semantic Search | Discovers generic alternatives (Metformin -> Glucophage, Metformin Stada) |
| **Tier 3** | Scout-Spawn TinyFish Agents | Dynamically spawns NEW agents for each discovered variant |
| **Tier 4** | Qwen 2.5 72B Analyst | Cross-validates all results, generates confidence score (0-100) |
| **Tier 5** | Investigation Swarm | Auto-spawns per-product investigators for anomalous prices (counterfeit research, WHO benchmarks, manufacturer verification) |

**Tier 3 is the scout-spawn**: the system discovers drugs it didn't know about at runtime, then autonomously deploys new agents to search for them.

**Tier 5 is the investigation swarm**: when anomalous pricing is detected, the system autonomously spawns one investigator agent per suspicious product — each running counterfeit risk research, WHO price benchmarking, and manufacturer verification in parallel.

### Agent War Room (Live Browser Previews)

Every TinyFish run emits a **STREAMING_URL** — the dashboard displays up to **5 live browser previews simultaneously** in a war room grid. Judges watch agents clicking through Long Chau, Pharmacity, An Khang in real time. Borders pulse cyan while active, turn green on success, and show results overlays on completion. Tier 3 variant agents also stream live previews.

### Enterprise-Grade Safety

We don't just find the cheapest price — we find the **safest cheapest price**:
- **Price anomaly detection**: Statistical outlier flagging for potential counterfeit/near-expiry
- **Government ceiling compliance**: Cross-reference against Vietnam's DAV declared prices
- **WHO reference pricing**: International benchmark badges
- **Investigation swarm**: Auto-triggered per-product agents for anomalous prices — counterfeit research + WHO benchmarks + manufacturer verification
- **Confidence scoring**: 5-signal weighted score (0-100)

---

## Key Metrics

| Metric | Value |
|--------|-------|
| Pharmacy chains scraped simultaneously | 5 |
| Total pharmacy stores covered | 3,751+ |
| Agent tiers in cascade | 5 (includes investigation swarm) |
| SSE event types | 24+ |
| Sponsor integrations | 9 |
| Exa use cases | 5 |
| API endpoints | 20+ |
| React components | 27+ |

---

## Why We Win

1. **Deepest TinyFish integration at the hackathon** — 5 parallel stealth agents, 4-tier cascade with dynamic scout-spawn, live browser preview, atomic batch endpoint
2. **9 sponsor integrations** — more than any other team, each one substantive (not bolt-on)
3. **Real enterprise problem** — $7B+ market, 57K pharmacies, documented 100-300% price variance
4. **Safety-first framing** — not just "find cheapest" but "find safest cheapest" with anomaly detection, compliance checking, and confidence scoring
5. **Vietnamese-first** — voice input, voice output, full i18n, Qwen normalization for Vietnamese drug names
6. **Production-grade engineering** — retry logic, caching, fallback chains, health checks, SSE streaming with 23 event types
7. **The demo sells itself** — watching AI agents navigate pharmacy websites in real time is viscerally compelling

---

**Demo script**: [docs/DEMO.md](docs/DEMO.md) | **Slides**: [docs/SLIDES.md](docs/SLIDES.md) | **Q&A prep**: [docs/Q&A.md](docs/Q&A.md)
