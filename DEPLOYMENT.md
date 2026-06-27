# Deployment Guide

Free-tier deployment: **Supabase** (DB) + **Fly.io** (backend + n8n) + **Vercel** (frontend).

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

## 3. n8n — Fly.io

### Deploy

```bash
cd n8n

# Launch the app (first time only)
fly launch --name ai-content-engine-n8n --region lhr --no-deploy

# Create a volume for persistent n8n data
fly volumes create n8n_data --region lhr --size 1

# Set secrets
fly secrets set \
  N8N_ENCRYPTION_KEY="$(openssl rand -hex 32)" \
  N8N_USER_MANAGEMENT_JWT_SECRET="$(openssl rand -hex 32)" \
  N8N_BASIC_AUTH_ACTIVE="false"

# Deploy
fly deploy

# Check logs
fly logs
```

### Configure n8n

1. Open `https://ai-content-engine-n8n.fly.dev` in a browser
2. Set up your admin account
3. Go to **Workflows → Import from File** and import `n8n/workflow.json`
4. In the imported workflow, update these fields:

   | Node | Field | Replace with |
   |------|-------|-------------|
   | **Fetch Client** | URL | `https://YOUR_BACKEND.fly.dev/clients/` → your actual backend URL |
   | **Generate Text** | `Authorization` header | Your OpenRouter API key |
   | **Generate Text** | `HTTP-Referer` header | Your frontend URL |
   | **Generate Images** | `apiKey` variable | Your OpenRouter API key |
   | **Generate Images** | `HTTP-Referer` header | Your frontend URL |
   | **Save Posts** | URL | `https://YOUR_BACKEND.fly.dev/n8n/save-posts` → your actual backend URL |

5. **Activate** the workflow (toggle at the top)

### Get the webhook URL

After activating, copy the **Webhook URL** from the Webhook node. It will look like:
```
https://ai-content-engine-n8n.fly.dev/webhook/generate-content
```

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

### Backend ↔ n8n

Set the n8n webhook URL as a secret on the backend:

```bash
fly secrets set \
  N8N_WEBHOOK_URL="https://ai-content-engine-n8n.fly.dev/webhook/generate-content" \
  ALLOWED_ORIGINS="https://your-frontend.vercel.app,http://localhost:3000"
```

### Frontend → Backend

The `NEXT_PUBLIC_API_URL` env var on Vercel points to `https://YOUR_BACKEND.fly.dev`.

### Verify

1. Visit your frontend URL
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
| OpenRouter | ~$0.20/100 posts | Pay per token — ~$0.002 per post with Claude Haiku |
| **Total** | **~$0/mo** | For light usage (~100 posts/mo) |

---

## Updating Each Service

```bash
# Backend
cd backend && fly deploy

# n8n
cd n8n && fly deploy

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
# Check volume is attached
fly volumes list
# Re-attach if missing: fly volumes create n8n_data --region lhr --size 1
```

**CORS errors in browser:**
```bash
# Update allowed origins
fly secrets set ALLOWED_ORIGINS="https://your-frontend.vercel.app,http://localhost:3000"
# Redeploy
fly deploy
```

**n8n webhook returning 404:**
Make sure the workflow is **activated** (toggle on) in the n8n editor.
