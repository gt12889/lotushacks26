# Judge / pitch sheet — Megladon MD

**One-liner:** Real-time **pharmaceutical price intelligence** for Vietnam by running **parallel AI web agents** across major pharmacy chains—because there is **no public pricing API**.

## Problem (15 seconds)

- **57,000+** pharmacies; same drug often **100–300%** apart in price.  
- Chains (**Long Chau, Pharmacity, An Khang, …**) sell online but **no unified API**; procurement and patients can’t compare live.

## Solution (20 seconds)

- **Megalodon MD** sends **five TinyFish agents** at once to chain sites, **streams** structured prices to a **Next.js** dashboard (**SSE**).  
- **FastAPI** orchestrates search, caching (SQLite), trends, alerts, optimizer flows, optional **Supermemory** / LLM layers.

## Why it’s hard (15 seconds)

- Real **e-commerce UIs**, **anti-bot**, **latency**, **messy HTML** → need **stealth automation**, not a single static scraper.

## Demo (10 seconds)

- Live search from dashboard → cards/grid + agent activity; mention **live preview** if visible.

## Traction / scope (10 seconds — honest)

- **Hackathon build**: working **MVP** on **5 sources**; deployable via **Docker + Railway** (see `docs/README.md`).

## Ask (5 seconds)

- **Enterprise track**: pilot with **procurement / chain ops**; **TinyFish** as agent infrastructure.

## Team & links

- Repo: (your GitHub)  
- Live demo: (fill in)  
- Deep dive: **`docs/ARCHITECTURE.md`**, **`docs/PRD.md`**
