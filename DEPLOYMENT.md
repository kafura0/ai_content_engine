# Deployment Guide

Free-tier deployment: **Supabase** (DB) + **Render** (backend) + **Vercel** (frontend) + **Docker** (n8n local).

**Live URLs:**
- Backend: `https://ai-content-engine-api.onrender.com`
- Frontend: `https://frontend-theta-steel-79.vercel.app`
- n8n: `http://localhost:5678` (local Docker only)

---

## 1. Supabase — Database

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **Project Settings → Database** and copy the connection string under "Connection string → URI"
3. Make sure it's the **session pooler** (port **5432**, not 6543):
   ```
   postgresql+asyncpg://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   ```
4. Go to **SQL Editor**, paste and run the migration SQL from `CLAUDE.md` (bottom of the file) — this creates all columns not yet in the schema

---

## 2. Backend — Render

### Prerequisites

- Push the repo to GitHub
- Create a free account at [render.com](https://render.com)

### Option A: render.yaml (auto-detected)

1. In Render Dashboard → **New + → Web Service**
2. Connect your GitHub repo
3. Render auto-detects `render.yaml` — review and **Create Web Service**
4. Set the following env vars in the dashboard (marked `sync: false` in the yaml):

   | Variable | Value |
   |----------|-------|
   | `OPENROUTER_API_KEY` | `sk-or-v1-...` |
   | `DATABASE_URL` | Supabase session pooler URI (from step 1) |
   | `SUPABASE_JWT_SECRET` | *(leave blank for dev mode)* or paste from Supabase → Settings → API → JWT Secret |

5. Deploy auto-starts — takes ~2 minutes
6. Your URL: `https://ai-content-engine-api.onrender.com`

### Option B: manual setup

1. In Render Dashboard → **New + → Web Service**
2. Connect your GitHub repo
3. Fill in:
   - **Name**: `ai-content-engine-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free
4. Add the same env vars as Option A above
5. **Create Web Service**

### Important notes

- Free tier **spins down after 15 min idle** — first request after idle takes ~30s
- To prevent spin-down, set up a [cron-job.org](https://cron-job.org) ping to `/health` every 10 min
- Use **Manual Deploy → Clear build cache & deploy** to force a clean rebuild

---

## 3. n8n — Local Docker

### Local Docker setup

```bash
# Start n8n
docker compose up -d n8n

# Open in browser
start http://localhost:5678
```

First-time setup: create an admin account at `http://localhost:5678`, then import `n8n/workflow.json` and configure the nodes.

### Configure n8n

1. Open `http://localhost:5678` in a browser
2. Set up your admin account
3. Go to **Workflows → Import from File** and import `n8n/workflow.json`
4. In the imported workflow, update these fields:

   | Node | Field | Replace with |
   |------|-------|-------------|
   | **Fetch Client** | URL | `https://ai-content-engine-api.onrender.com/clients/` |
   | **Generate Text** | `Authorization` header | Your OpenRouter API key |
   | **Generate Text** | `HTTP-Referer` header | `https://frontend-theta-steel-79.vercel.app` |
   | **Generate Images** | `apiKey` variable | Your OpenRouter API key |
   | **Generate Images** | `HTTP-Referer` header | `https://frontend-theta-steel-79.vercel.app` |
   | **Save Posts** | URL | `https://ai-content-engine-api.onrender.com/n8n/save-posts` |

5. **Activate** the workflow (toggle at the top)

### Get the webhook URL

After activating, the **Webhook URL** is:
```
http://localhost:5678/webhook/generate-content
```

The backend's direct `/generate-content` path does not require n8n — it calls OpenRouter directly.

---

## 4. Frontend — Vercel

### Deploy

```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Deploy (follow prompts — Vercel auto-detects Next.js)
vercel --prod
```

### Set environment variable

In Vercel Dashboard → Project → Settings → Environment Variables:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_URL` | `https://ai-content-engine-api.onrender.com` |

Then redeploy with **Clean Cache** enabled (plain redeploy reuses the cached build and ignores the new env value).

### Alternative: connect GitHub repo

1. Push the whole repo to GitHub
2. In Vercel Dashboard → **Add New Project** → Import your GitHub repo
3. Framework = **Next.js**, Root Directory = `frontend`
4. Add env var `NEXT_PUBLIC_API_URL` = `https://ai-content-engine-api.onrender.com`
5. Deploy — Vercel auto-rebuilds on every push

**Important:** `NEXT_PUBLIC_*` vars are baked into the bundle at build time. After changing them, always do **Clean Cache & Redeploy**.

---

## 5. Connect Everything

### Frontend → Backend

The `NEXT_PUBLIC_API_URL` env var on Vercel must match the Render service URL.

### Verify

1. Visit `https://frontend-theta-steel-79.vercel.app`
2. Create a test client
3. Trigger content generation (direct path uses `/generate-content`, no n8n needed)
4. Check that posts appear

---

## Costs Breakdown

| Service | Cost | Limits |
|---------|------|--------|
| Supabase Free | $0 | 500 MB DB, 2 GB bandwidth |
| Render | $0 | 512 MB RAM, 100 GB bandwidth, spins down after 15 min |
| Vercel | $0 | 100 GB bandwidth, 6000 build mins |
| OpenRouter | ~$0.01/100 posts | gemini-2.5-flash-lite is very cheap — $0.15/M tokens input, $0.60/M output |
| **Total** | **~$0/mo** | For light usage (~100 posts/mo) |

---

## Updating Each Service

```bash
# Backend — push to GitHub, Render auto-deploys
git push origin main

# n8n (local Docker)
docker compose restart n8n

# Frontend (Vercel CLI)
cd frontend && vercel --prod

# Or push to GitHub — Vercel auto-deploys
git push origin main
```

---

## Troubleshooting

**Backend health check failing:**
Check Render Dashboard → your service → **Logs** tab.

**n8n data lost:**
```bash
# Restart local Docker container
docker compose restart n8n
```

**CORS errors in browser:**
Update `ALLOWED_ORIGINS` env var in Render Dashboard → Environment → Redeploy.

**n8n webhook returning 404:**
Make sure the workflow is **activated** (toggle on) in the n8n editor.

**Render slow first request:**
Free tier spins down after 15 min. Set up a [cron-job.org](https://cron-job.org) ping to `https://ai-content-engine-api.onrender.com/health` every 10 min.
