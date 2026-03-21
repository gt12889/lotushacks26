# Docker Compose hosting (local + “free” public demo)

**Docker Compose does not host anything by itself** — it only runs containers on a machine you control. To get a **free** public URL you typically:

1. Run Compose on a **free cloud VM**, or  
2. Run Compose on your **laptop** and expose **one HTTPS URL** with a **tunnel** (ngrok, Cloudflare Tunnel, etc.).

---

## Quick start (same Wi‑Fi / localhost)

From the **repository root** (where `docker-compose.yml` lives):

```bash
cp .env.docker.example .env
# Edit .env — at minimum set TINYFISH_API_KEY
docker compose build
docker compose up -d
```

- UI: **http://localhost:3005**  
- API health: **http://localhost:8000/health**

Stop: `docker compose down`

---

## Why `NEXT_PUBLIC_API_URL` and `CORS_ORIGINS` matter

- The Next.js app calls the API **from the user’s browser**. So `NEXT_PUBLIC_API_URL` must be whatever the **browser** can open (usually `http://YOUR_PUBLIC_IP:8000` or `https://…`), **not** `http://api:8000`.
- After you **change** `NEXT_PUBLIC_API_URL`, you must **rebuild** the web image:  
  `docker compose build --no-cache web && docker compose up -d`
- `CORS_ORIGINS` on the API must include the **exact** UI origin (scheme + host + port), e.g. `http://203.0.113.10:3005`.

---

## Free (or cheap) ways to get a public URL

| Option | What you do | Notes |
|--------|-------------|--------|
| **Oracle Cloud “Always Free”** | Create a small VM (ARM or x86), install Docker, clone repo, set `.env`, `docker compose up -d`, open firewall ports **3005** and **8000** | Stable if you accept signup + card verification |
| **Google Cloud e2-micro** | Free tier in **us-central1** etc.; same steps as Oracle | Quotas / always-on limits apply |
| **Laptop + tunnel** | `docker compose up` locally, then **Cloudflare Tunnel** or **ngrok** to expose **3005** (and tunnel or split API if needed) | Fastest for a **demo**; free tiers vary |
| **Fly.io / Render** | Often **one** container per free service — you’d run **API** and **web** as two services or use a **single** reverse proxy image | Not plain Compose on their free tier |

There is no long-term “free Heroku for full Compose stacks” anymore; **Always Free VMs** + Compose is the usual hackathon pattern.

---

## VPS checklist (Oracle / GCP / any Linux VM)

1. Install Docker + Compose plugin:  
   `https://docs.docker.com/engine/install/`  
2. Clone repo, `cp .env.docker.example .env`, fill keys.  
3. Set **public** values (replace IP):  
   - `NEXT_PUBLIC_API_URL=http://YOUR_PUBLIC_IP:8000`  
   - `CORS_ORIGINS=http://YOUR_PUBLIC_IP:3005`  
4. `docker compose build --no-cache && docker compose up -d`  
5. Open **security group / firewall**: TCP **8000** and **3005** (or change `API_PUBLISH_PORT` / `WEB_PUBLISH_PORT` in `.env` and open those).

---

## SQLite data

The API SQLite file lives **inside** the API container by default. Removing the container loses data unless you later add a volume and point the app at a mounted path (would need a small code change to honor `DATABASE_URL` for the file path).

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Browser “Network error” / CORS | Add your UI URL to `CORS_ORIGINS`; restart **api** container |
| UI still calls wrong API | Rebuild **web** after changing `NEXT_PUBLIC_API_URL` |
| API unhealthy | Check `docker compose logs api`; confirm `TINYFISH_API_KEY` if health checks hit external services |

---

## Related

- Variable names also listed in [`../railway.env.example`](../railway.env.example)  
- Main readme: [README.md](./README.md)
