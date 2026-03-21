# What shipped (hackathon scope)

Use this for **slides**, **judging forms**, and **README** highlights. Tick what is true for your final submission.

## Core

- [x] FastAPI backend with **SSE search** across **5 pharmacy sources** (TinyFish)  
- [x] Next.js dashboard: search, results, metrics, agent feed, live preview hooks  
- [x] SQLite persistence (prices, sources, alerts, monitors)  
- [x] Landing page + **dashboard** route split  
- [x] **EN/VI** locale toggle (partial coverage — see `KNOWN-ISSUES.md`)  

## Intelligence & extras

- [ ] / [x] **Supermemory** recall (when key configured)  
- [ ] / [x] **Insights** / LLM summaries (OpenRouter/OpenAI)  
- [ ] / [x] **OCR** prescription → optimizer path  
- [ ] / [x] **Discord** / **ElevenLabs** demo alerts  
- [ ] / [x] **Trends** / **alerts** / **optimize** pages wired end-to-end  

## Ops

- [x] **Dockerfiles** + **Railway** `railway.toml` per service  
- [x] **`railway.env.example`** variable checklist (repo root)  

## Nice-to-have (not blocking)

- [ ] Full **Vietnamese** copy everywhere  
- [ ] **Postgres** / durable volume for production DB  
- [ ] Automated **E2E** tests  

**Last updated:** (fill date)
