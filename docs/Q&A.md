# Anticipated Q&A — Megladon MD

Short answers for **judges** and **mentors**. Expand verbally if they dig in.

## Data & accuracy

**Q: How do you know prices are correct?**  
A: We read **live listing pages** like a user would; we show **source + timestamp**. Wrong HTML or promos can skew a row—we surface **which pharmacy** returned it so humans can verify.

**Q: How often is data fresh?**  
A: **On demand** per search; we can add **scheduled monitors** (APScheduler) for SKUs you care about.

## Legal / ToS

**Q: Is scraping allowed?**  
A: Hackathon **research** scope; production needs **ToS**, **robots.txt**, and **rate** compliance. We’re not bypassing paywalls or medical advice.

## Scale

**Q: Can you add every pharmacy?**  
A: **Architecture** is per-source agents; each new chain is a new **agent config** + validation. Chains listed in **`docs/README.md`** are Tier 1.

## TinyFish

**Q: Why TinyFish?**  
A: **Stealth browsers** and **parallel** runs match **real** pharmacy sites better than raw HTTP to unknown anti-bot stacks.

## Business

**Q: Who pays?**  
A: **B2B**: hospital procurement, chains, insurers doing **formulary** cost models—subscription for **API + dashboard** access.

## Tech

**Q: Stack?**  
A: **Next.js 16**, **FastAPI**, **SQLite**, **SSE**, optional **OpenRouter / Supermemory**.

**Q: Why SQLite?**  
A: **Fast** MVP and **zero** managed DB cost; swap to **Postgres** for multi-tenant production.

## Failure modes

**Q: What if a site is down?**  
A: That **source** returns **error** in the stream; others still complete—dashboard shows **partial** results.
