# CLAUDE.md — AI Content Engine

## What this project is

A multi-tenant SaaS platform for AI-generated social media content. Agency operators add clients, each with a rich brand profile, and the system generates platform-specific posts (hook, caption, hashtags, image prompt) via Gemini on OpenRouter. Content is stored in Supabase and displayed in a Next.js dashboard.

**Live URLs:** Backend → `https://ai-content-engine-api.fly.dev` · Frontend → `https://frontend-theta-steel-79.vercel.app`

---

## Monorepo layout

```
ai_content_engine/
├── backend/          FastAPI + SQLAlchemy 2.0 async
├── frontend/         Next.js 14 App Router + Tailwind CSS
├── n8n/              n8n workflow JSON (async generation path)
├── docker-compose.yml
└── .env.example
```

---

## Tech stack

| Layer | Tech |
|---|---|
| Backend | FastAPI, SQLAlchemy 2.0 async, asyncpg, Pydantic v2 |
| Database | Supabase PostgreSQL (prod) / SQLite + aiosqlite (local dev) |
| AI text | Gemini via OpenRouter (`google/gemini-2.5-flash-lite`, JSON mode, `max_tokens=2048`) |
| AI images | Gemini via OpenRouter (`google/gemini-2.5-flash-image`) |
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS 3 |
| Infra | Fly.io (backend), Vercel (frontend), Docker (n8n local) |
| Automation | n8n v2 self-hosted (async content generation path) |

---

## Environment variables

Defined in `.env` (local) and set as runtime secrets (Fly.io) / build-time env vars (Vercel).

```
# Backend (runtime — set via `fly secrets set`)
OPENROUTER_API_KEY=
OPENROUTER_TEXT_MODEL=google/gemini-2.5-flash-lite
OPENROUTER_IMAGE_MODEL=google/gemini-2.5-flash-image
DATABASE_URL=postgresql+asyncpg://...
N8N_WEBHOOK_URL=          # optional — n8n async path

# Frontend (build-time env on Vercel → NEXT_PUBLIC_*)
NEXT_PUBLIC_API_URL=https://ai-content-engine-api.fly.dev
```

`NEXT_PUBLIC_API_URL` is baked into the Next.js bundle at build time. After changing it in Vercel Dashboard → Environment Variables, do **Clean Cache + redeploy**, not just redeploy.

---

## Backend structure

```
backend/
├── main.py                         FastAPI app, lifespan, CORS, route registration
├── app/
│   ├── config.py                   Pydantic Settings — loads .env
│   ├── database.py                 Async engine, Base, session factory, SSL for Supabase
│   ├── models/
│   │   ├── client.py               Client ORM — all profile fields
│   │   └── post.py                 Post ORM — hook, caption, hashtags, image_url, status
│   ├── schemas/
│   │   ├── client.py               ClientCreate, ClientUpdate, ClientResponse, ClientListResponse
│   │   └── content.py              PostOut, ContentResponse
│   ├── routes/
│   │   ├── clients.py              CRUD + PATCH active status
│   │   ├── content.py              POST /generate-content (direct) + /trigger-generation (n8n)
│   │   ├── posts.py                GET /posts/{client_id}
│   │   └── n8n.py                  POST /n8n/save-posts (receives posts from n8n)
│   ├── services/
│   │   ├── client_service.py       create, get, list, set_active, delete, get_posts_for_client
│   │   ├── content_generator.py    Orchestrator: LLM → parse → image generation → DB persist
│   │   └── image_generator.py      Gemini image call with retry (1s, 2s, 4s backoff) — never raises
│   ├── prompts/
│   │   └── content_prompts.py      SYSTEM_PROMPT + build_viral_prompt() — see Prompt system below
│   └── openrouter/
│       ├── text_client.py          chat_completion() — JSON mode, temp 0.85
│       └── image_client.py         generate_image() — extracts URL from response
```

### Key backend rules
- All DB operations are `async` — never use sync SQLAlchemy calls
- Always `await db.refresh(obj)` after commit if you need the updated object back
- Image generation failures are swallowed intentionally — a post without an image is better than a failed batch
- `client.is_active` is checked at the route level before generation — returns 403 if inactive

---

## Frontend structure

```
frontend/
├── app/
│   ├── layout.js             Root layout with Navbar
│   ├── page.js               Redirects to /clients
│   ├── clients/page.js       Client list + create form (4 sections)
│   ├── generate/page.js      Select client, pick count, trigger generation
│   └── posts/page.js         View saved posts per client
├── components/
│   ├── Navbar.js             Top nav — /clients, /generate, /posts
│   ├── ClientCard.js         Card with active toggle, generate, view posts, delete
│   └── PostCard.js           Individual post display
└── lib/
    └── api.js                All fetch calls — BASE = NEXT_PUBLIC_API_URL
```

### Key frontend rules
- All pages are `'use client'` — no server components currently
- `api.js` is the only place that calls the backend — never fetch directly from page components
- `NEXT_PUBLIC_API_URL` defaults to `http://localhost:8000` if not set
- After adding a new backend endpoint, add a corresponding function to `lib/api.js`

---

## Client data model

The `Client` model has three logical groups of fields:

**Core (required):** `name`, `industry`, `tone_of_voice`, `services`, `posting_goals`

**AI content intelligence (optional — improve output significantly):**
`target_audience`, `location`, `brand_colors`, `image_style`, `price_positioning`,
`audience_pain_points`, `unique_selling_points`, `past_wins`, `platforms`,
`brand_tagline`, `words_to_avoid`, `founding_story`, `cta_destination`

**Operational (optional):**
`monthly_post_quota` (default 20), `notes` (internal, not sent to AI),
`timezone` (default UTC), `facebook_page_id`, `instagram_account_id`, `tiktok_account_id`

`is_active` controls whether content can be generated. Inactive clients retain all stored posts.

---

## Prompt system

`backend/app/prompts/content_prompts.py` is the core of the AI output quality.

**`SYSTEM_PROMPT`** — sets the AI persona: senior social media strategist, 10+ years, global bans list, non-repetition rules, JSON-only output.

**`build_viral_prompt(client, count)`** — builds the full user prompt from the client profile:
- Rotates content types: `educational → authority → social_proof → problem_solution → behind_the_scenes`
- Rotates hook styles independently: `curiosity → problem → warning → authority → local`
- Injects client intelligence: pain points into hooks, USPs into authority posts, past wins into social proof, founding story into behind-the-scenes
- Adds platform-specific formatting rules if `client.platforms` is set
- Adds price positioning language guide if `client.price_positioning` is set
- Appends `client.words_to_avoid` to the global bans list
- Local context is multi-country — references the location naturally without hardcoding regional logic

When editing the prompt, keep the output schema (`_POST_SCHEMA`) unchanged — the content generator parses that exact JSON shape.

---

## Content generation flow

### Direct path (used by frontend)
```
POST /generate-content/{client_id}?count=N
  → check client exists + is_active
  → build_viral_prompt(client, count)
  → OpenRouter (Gemini) → JSON with N posts
  → parse posts
  → generate images concurrently (Gemini, with retry)
  → persist all posts to DB with status="completed"
  → return ContentResponse
```

### n8n async path (deferred — not currently used by frontend)
```
POST /trigger-generation/{client_id}
  → POST to N8N_WEBHOOK_URL with {client_id}
  → n8n fetches client, builds prompt, calls LLM, generates images
  → n8n POSTs completed posts to POST /n8n/save-posts
  → frontend polls GET /posts/{client_id}
```

---

## Database

### Local dev
Uses SQLite (`./content_engine.db`). Tables are auto-created on startup via `Base.metadata.create_all`.

### Production (Supabase)
Uses PostgreSQL via **session pooler** (port 5432 on `aws-0-{region}.pooler.supabase.com`).
- **Do not** use the transaction pooler (port 6543) — incompatible with asyncpg prepared statements
- **Do not** use the direct connection host on port 5432 from a VPS — often blocked by firewalls
- SSL is configured in `database.py` with `ssl="require"` and statement cache disabled

### Schema migrations
Supabase does not auto-apply ORM changes. After adding a column to a model, write an explicit `ALTER TABLE` and run it in the Supabase SQL editor.

Full migration SQL is maintained at the bottom of this file — keep it updated when adding columns.

---

## Deployment (Dokploy)

Both services are deployed on Dokploy with Traefik handling SSL and routing.

- **Backend** → `api.yourdomain.com` (Docker, port 8000)
- **Frontend** → `yourdomain.com` (Docker, port 3000)
- **n8n** → `n8n.yourdomain.com` (Docker Compose service, port 5678 internal only)

After pushing to `main`, Dokploy auto-deploys both services.

**Frontend env change workflow:**
1. Update `NEXT_PUBLIC_API_URL` in Dokploy → Environment → Build-time Arguments
2. Click **Clean Cache** then **Redeploy** (plain redeploy reuses the cached build and ignores the new value)

---

## Deployment (Fly.io + Vercel)

Actual current deployment:

- **Backend** → `https://ai-content-engine-api.fly.dev` (Fly.io, port 8000)
- **Frontend** → `https://frontend-theta-steel-79.vercel.app` (Vercel)
- **n8n** → `http://localhost:5678` (Docker local — Fly.io trial org blocked from deploying n8n without credit card)

### Backend deploy
```bash
cd backend
fly deploy
```

### Frontend deploy
```bash
cd frontend
vercel --prod
```

### Set secrets
```bash
fly secrets set \
  OPENROUTER_API_KEY="sk-or-v1-..." \
  DATABASE_URL="postgresql+asyncpg://..." \
  ALLOWED_ORIGINS="https://frontend-theta-steel-79.vercel.app,http://localhost:3000"
```

**Frontend env change workflow (Vercel):**
1. Update `NEXT_PUBLIC_API_URL` in Vercel Dashboard → Environment Variables
2. Click **Clean Cache** then **Redeploy** (plain redeploy reuses the cached build)

---

## Adding a new feature checklist

**New backend field on Client:**
1. Add column to `backend/app/models/client.py`
2. Add field to `ClientCreate` and `ClientResponse` in `backend/app/schemas/client.py`
3. If it feeds the AI: update `build_viral_prompt()` in `content_prompts.py`
4. Add `ALTER TABLE clients ADD COLUMN IF NOT EXISTS ...` to the migration SQL below
5. Add field to the create form in `frontend/app/clients/page.js`

**New API endpoint:**
1. Add route to the relevant file in `backend/app/routes/`
2. Add service function to `backend/app/services/`
3. Add fetch function to `frontend/lib/api.js`

**New frontend page:**
1. Create `frontend/app/{name}/page.js` with `'use client'`
2. Add nav link to `frontend/components/Navbar.js`

---

## Common gotchas

- `brand_colors` is `list[str]` (hex strings), not a dict. The prompt builder handles legacy dict format with an `isinstance` check.
- `client.is_active` defaults to `True` — no migration needed for existing rows.
- n8n `$env` access is blocked by default in v2. Variables feature is paid. Use hardcoded values or the HTTP Request node to fetch config.
- n8n webhook data is at `$json.body.client_id`, not `$json.client_id`.
- Never use `N8N_BASIC_AUTH_ACTIVE=true` — removed in n8n v2, causes auth conflicts.
- Timezone bug: `datetime.now(timezone.utc)` returns offset-aware, but `datetime.utcnow()` returns offset-naive. Using both in the same model/service causes `ValueError: can't subtract offset-naive and offset-aware datetimes`. Use `datetime.utcnow()` everywhere.
- `max_tokens` defaults to unlimited in OpenRouter, which can drain credits fast. Always set `max_tokens=2048` in `text_client.py`.

---

## Install flyctl (Fly.io CLI)

```powershell
winget install flyctl
# or
irm https://fly.io/install.ps1 | iex
```

---

## Full Supabase migration SQL

Run this in the Supabase SQL editor. All statements are idempotent.

```sql
-- posts
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'completed';

-- clients: subscription
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- clients: AI intelligence
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS audience_pain_points  JSONB,
  ADD COLUMN IF NOT EXISTS unique_selling_points JSONB,
  ADD COLUMN IF NOT EXISTS past_wins             JSONB,
  ADD COLUMN IF NOT EXISTS platforms             JSONB,
  ADD COLUMN IF NOT EXISTS price_positioning     VARCHAR(50);

-- clients: brand identity
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS brand_tagline   VARCHAR(500),
  ADD COLUMN IF NOT EXISTS words_to_avoid  JSONB,
  ADD COLUMN IF NOT EXISTS founding_story  TEXT,
  ADD COLUMN IF NOT EXISTS cta_destination VARCHAR(500);

-- clients: operational
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS monthly_post_quota INTEGER NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS notes              TEXT;

-- clients: publishing / scheduling
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS timezone              VARCHAR(100) NOT NULL DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS facebook_page_id      VARCHAR(100),
  ADD COLUMN IF NOT EXISTS instagram_account_id  VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tiktok_account_id     VARCHAR(100);

-- clients: auth ownership + Meta publishing token
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS owner_id          UUID,
  ADD COLUMN IF NOT EXISTS meta_access_token VARCHAR(500);

CREATE INDEX IF NOT EXISTS idx_clients_owner_id ON clients(owner_id);

-- posts: publish tracking
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS published_to JSONB;
```
