# Slide outline — Megladon MD

Copy bullets into Google Slides, Canva, or Gamma. **~6–8 slides** for a 3-minute slot.

---

## Slide 1 — Title

- **Megalodon MD** — Pharmaceutical price intelligence for Vietnam  
- LotusHacks 2026 · Enterprise / TinyFish  
- Team names · **QR → live demo** (optional)

---

## Slide 2 — Problem

- 57k+ pharmacies · **no unified price API**  
- Same medicine → **100–300%** price spread  
- Hospital procurement & chains need **live** comparison

---

## Slide 3 — Solution

- **5 parallel AI web agents** (TinyFish) → major chains **at once**  
- **FastAPI + SSE** → results stream to **Next.js** dashboard  
- Normalized view: **best price**, range, **savings signal**

---

## Slide 4 — Why it’s hard

- Real **B2C e-commerce** UIs  
- **Anti-bot**, CAPTCHA, layout drift  
- Not solvable with one static scraper → **agent + stealth** stack

---

## Slide 5 — Demo (screenshot or live)

- Dashboard search → **agent activity** + **price grid**  
- One annotation: **“parallel runs, live stream”**

---

## Slide 6 — Architecture (simple)

- Browser → **Next.js** → **FastAPI** → **TinyFish** ×5 → **SQLite**  
- Optional: Supermemory, OpenRouter, Exa (if you pitch it)

---

## Slide 7 — Traction / roadmap

- **MVP** on 5 chains · **Docker + Railway** deploy  
- Next: **procurement pilot**, more sources, durable DB

---

## Slide 8 — Thank you / contact

- Repo link · demo URL · **one sentence ask** (pilot / partner)
