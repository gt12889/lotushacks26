# Live demo script — Megladon MD

**Target length:** 60–90 seconds for judges; 2–3 minutes if relaxed.

## Before you go live

1. Open **frontend** and **backend** health: `GET …/health` should return `ok`.
2. Confirm **`CORS_ORIGINS`** includes your demo UI origin (Railway/Vercel/local).
3. Have **one backup query** written down (see below) if the first search is slow.

## URLs (fill in)

| What | URL |
|------|-----|
| Production UI | `___________________________` |
| Production API | `___________________________` |
| Local UI (backup) | `http://localhost:3005` |
| Local API (backup) | `http://localhost:8000` |

## Script (say this while clicking)

1. **Hook (10s)**  
   “Vietnam has tens of thousands of pharmacies and no single price list. We fire **five browser agents in parallel** across the major chains and stream results live.”

2. **Landing (5s)**  
   Scroll or point at hero → **Enter Dashboard**.

3. **Search (30–45s)**
   - Type a **common VN SKU** (e.g. `Metformin 500mg`, `Paracetamol 500mg`, `Omeprazole 20mg`).
   - Click **Deploy Probe** / submit.
   - Point at: **Qwen normalization pill** (shows Vietnamese → English transform with `[Qwen]` badge), **6-tier Agent Cascade** progressing, **live metrics**, **agent feed**, **pharmacy cards**, **sponsor badges on results** (`[TinyFish]`, `[BrightData]`, `[Exa]`).
   - After results: point at **Analyst Verdict** → expand to show **confidence breakdown** (5 signal bars), **voice summary** auto-plays (`[ElevenLabs]`).
   - One line: “This is **SSE** — results arrive as each pharmacy agent finishes. Nine sponsor integrations, all visible.”

4. **Differentiator (10s)**
   “Six-tier cascade: TinyFish agents with **BrightData proxy** and **stealth**, **Exa** discovers generics, **Qwen** normalizes Vietnamese, and an **Investigation Swarm** auto-verifies anomalous prices. **Supermemory** recalls past searches.”

5. **Close (5s)**  
   “Repo + deploy docs are in **`docs/`**; API is FastAPI, UI is Next.js.”

## Backup if search is slow or fails

- Show **landing** + **dashboard empty state** and explain the **architecture** (`docs/ARCHITECTURE.md`).  
- Open **`/health`** and **`/health/services`** in a tab to show the stack is up.  
- Say honestly: “Pharmacy sites rate-limit; we’re showing the **orchestration and UI**; in testing we saw results for [X].”

## Backup queries

1. `Metformin 500mg`  
2. `Paracetamol 500mg`  
3. `Vitamin C 1000mg`

## After demo

- Note anything that broke → **`docs/KNOWN-ISSUES.md`**.
