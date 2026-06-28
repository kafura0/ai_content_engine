# Deployment Guide

Free-tier deployment: **Supabase** (DB) + **Fly.io** (backend) + **Vercel** (frontend) + **Docker** (n8n local).

**Live URLs:**
- Backend: `https://ai-content-engine-api.fly.dev`
- Frontend: `https://frontend-theta-steel-79.vercel.app`
- n8n: `http://localhost:5678` (local Docker only — Fly.io trial org blocks n8n deploy)

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

## 2. Backend — Fly.io

### Prerequisites

- Install [flyctl](https://fly.io/docs/flyctl/install/)
- Run `fly auth login`

### Deploy

```bash
cd backend

# Launch the app (first time only)
fly launch --name ai-content-engine-api --region lhr --no-deploy

# Set secrets (never bake these into the image)
fly secrets set \
  OPENROUTER_API_KEY="sk-or-v1-..." \
  DATABASE_URL="postgresql+asyncpg://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres" \
  ALLOWED_ORIGINS="https://your-frontend.vercel.app"

# Deploy
fly deploy

# Check logs
fly logs
```

### Update after first deploy

```bash
cd backend
fly deploy
```

---

## 3. n8n — Local Docker (Fly.io deploy blocked)

> **Note:** n8n deploy to Fly.io is blocked on trial orgs — "This functionality is disabled for trial organizations. Please add a credit card". Run n8n locally via Docker instead.

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
   | **Fetch Client** | URL | `https://ai-content-engine-api.fly.dev/clients/` |
   | **Generate Text** | `Authorization` header | Your OpenRouter API key |
   | **Generate Text** | `HTTP-Referer` header | `https://frontend-theta-steel-79.vercel.app` |
   | **Generate Images** | `apiKey` variable | Your OpenRouter API key |
   | **Generate Images** | `HTTP-Referer` header | `https://frontend-theta-steel-79.vercel.app` |
   | **Save Posts** | URL | `https://ai-content-engine-api.fly.dev/n8n/save-posts` |

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
| `NEXT_PUBLIC_API_URL` | `https://YOUR_BACKEND.fly.dev` |

Then redeploy: `vercel --prod`

### Alternative: connect GitHub repo

1. Push the whole repo to GitHub
2. In Vercel Dashboard → **Add New Project** → Import your GitHub repo
3. Framework = **Next.js**, Root Directory = `frontend`
4. Add env var `NEXT_PUBLIC_API_URL` = `https://YOUR_BACKEND.fly.dev`
5. Deploy — Vercel auto-rebuilds on every push

---

## 5. Connect Everything

### Backend → n8n (optional — only needed for async path)

Set the n8n webhook URL as a secret on the backend:

```bash
fly secrets set \
  N8N_WEBHOOK_URL="http://localhost:5678/webhook/generate-content" \
  ALLOWED_ORIGINS="https://frontend-theta-steel-79.vercel.app,http://localhost:3000"
```

The Fly.io backend cannot reach `localhost:5678` — n8n async path only works when both run locally.

### Frontend → Backend

The `NEXT_PUBLIC_API_URL` env var on Vercel is set to `https://ai-content-engine-api.fly.dev`.

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
| Fly.io | $0 | 3 shared VMs (256 MB each), 3 GB persistent volume |
| Vercel | $0 | 100 GB bandwidth, 6000 build mins |
| OpenRouter | ~$0.01/100 posts | gemini-2.5-flash-lite is very cheap — $0.15/M tokens input, $0.60/M output |
| **Total** | **~$0/mo** | For light usage (~100 posts/mo) |

---

## Updating Each Service

```bash
# Backend
cd backend && fly deploy

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
```bash
fly logs
fly ssh console
```

**n8n data lost:**
```bash
# Restart local Docker container
docker compose restart n8n
```

**CORS errors in browser:**
```bash
# Update allowed origins
fly secrets set ALLOWED_ORIGINS="https://frontend-theta-steel-79.vercel.app,http://localhost:3000"
# Redeploy
fly deploy
```

**n8n webhook returning 404:**
Make sure the workflow is **activated** (toggle on) in the n8n editor.
