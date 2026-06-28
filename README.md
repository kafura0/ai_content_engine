# AI Content Engine

[![Live](https://img.shields.io/badge/demo-DEMO.md-blue)](DEMO.md)

A production-ready multi-client social media content engine powered by **Gemini** (text + images) via OpenRouter.

Create a client profile once. Generate viral, brand-consistent social media posts with AI images instantly — via API, dashboard, or automated n8n workflow.

---

## Features

- **Multi-tenant** — unlimited client profiles, fully isolated content per client
- **Viral content** — Gemini generates hooks, captions, CTAs, and hashtags tuned to each brand's tone and audience
- **AI images** — Gemini 2.5 Flash generates a branded image per post via OpenRouter
- **Content rotation** — automatically cycles through 5 content types: educational, authority, social proof, problem-solution, behind-the-scenes
- **Persistent storage** — all clients and generated posts saved to database
- **Next.js dashboard** — browse clients, generate content, and view posts in a visual UI
- **n8n automation** — drop-in workflow to run content generation on a schedule
- **Production-ready** — async throughout, retry logic on image generation, strict JSON output, Pydantic validation

---

## Tech Stack

| Layer | Technology |
|---|---|
| API | FastAPI + Uvicorn |
| LLM (text) | Gemini 2.5 Flash Lite via OpenRouter |
| LLM (images) | Gemini 2.5 Flash Image via OpenRouter |
| Database | SQLite (dev) / PostgreSQL (prod) |
| ORM | SQLAlchemy 2.0 async |
| Validation | Pydantic v2 |
| HTTP client | httpx (async) |
| Frontend | Next.js 14 App Router |
| Automation | n8n workflow |

---

## Project Structure

```
ai_content_engine/          # Python backend
├── main.py                 # App entry point, lifespan, routers
├── requirements.txt
├── .env                    # Your secrets (never commit)
├── .env.example            # Template
├── n8n/
│   └── workflow.json       # Importable n8n automation workflow
└── app/
    ├── config.py           # All settings from .env
    ├── database.py         # Async engine, Base, session, create_tables
    ├── models/
    │   ├── client.py       # Client ORM model
    │   └── post.py         # Post ORM model (FK → clients)
    ├── schemas/
    │   ├── client.py       # ClientCreate, ClientResponse, BrandColors
    │   └── content.py      # PostOut, ContentResponse
    ├── prompts/
    │   └── content_prompts.py  # Viral prompt builder per client profile
    ├── openrouter/
    │   ├── text_client.py  # Chat completion (JSON mode)
    │   └── image_client.py # Image generation via chat completions endpoint
    ├── services/
    │   ├── client_service.py   # Client CRUD + post retrieval
    │   ├── image_generator.py  # Retry wrapper (3 attempts, exponential backoff)
    │   └── content_generator.py # Orchestrator: text + concurrent images + DB save
    └── routes/
        ├── clients.py      # GET /clients, POST /clients, GET /clients/{id}
        ├── content.py      # POST /generate-content/{client_id}
        ├── posts.py        # GET /posts/{client_id}
        └── n8n.py          # POST /n8n/save-posts (receives posts from n8n)

frontend/                   # Next.js 14 frontend
├── app/
│   ├── clients/page.js     # Client management (create, view, browse)
│   ├── generate/page.js    # Generate content per client
│   └── posts/page.js       # Browse saved posts per client
├── components/
│   ├── ClientCard.js       # Client card with brand colors + actions
│   └── PostCard.js         # Post card with image, hook, caption, hashtags
├── lib/
│   ├── api.js              # API wrapper for all backend calls
│   └── supabase.js         # Auth helpers (DEV_MODE / production)
└── jsconfig.json           # Enables @/ path alias
```

---

## Quick Start

### Backend

#### 1. Install dependencies

```bash
pip install -r requirements.txt
```

#### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_TEXT_MODEL=google/gemini-2.5-flash-lite
OPENROUTER_IMAGE_MODEL=google/gemini-2.5-flash-image
DATABASE_URL=sqlite+aiosqlite:///./content_engine.db
IMAGE_RETRY_COUNT=3
```

#### 3. Run

```bash
uvicorn main:app --reload
```

Server starts at `http://127.0.0.1:8000`
Interactive docs at `http://127.0.0.1:8000/docs`

---

### Frontend (Next.js Dashboard)

```bash
cd frontend
npm install
npm run dev
```

Dashboard at `http://localhost:3000`

---

## API Reference

### `POST /clients`
Create a new client profile.

**Request body:**
```json
{
  "name": "Apex Electrical",
  "industry": "electrical contracting",
  "tone_of_voice": "professional",
  "brand_colors": ["#FFD700", "#1A1A1A"],
  "image_style": "cinematic",
  "target_audience": "homeowners and construction firms in Nairobi",
  "services": ["wiring", "solar installation", "CCTV"],
  "location": "Nairobi, Kenya",
  "posting_goals": ["leads", "awareness"]
}
```

**Returns:** Full client object including generated `id`.

---

### `GET /clients`
List all clients.

---

### `GET /clients/{client_id}`
Fetch a single client by ID.

---

### `POST /generate-content/{client_id}?count=5`
Generate viral social media posts for a client.

- `count` — number of posts to generate (1–10, default 5)

**Returns:**
```json
{
  "client_id": "uuid",
  "client_name": "Apex Electrical",
  "posts": [
    {
      "id": "uuid",
      "content_type": "educational",
      "hook": "Most Nairobi homes are one fault away from a fire.",
      "caption": "Faulty wiring is the leading cause of house fires in Kenya...",
      "emotional_trigger": "urgency",
      "call_to_action": "DM us for a free electrical inspection today.",
      "hashtags": ["#ElectricalSafety", "#NairobiHomes", "#ApexElectrical"],
      "image_prompt": "cinematic photo of an electrician...",
      "image_url": "data:image/png;base64,...",
      "created_at": "2026-04-14T10:00:00"
    }
  ]
}
```

---

### `GET /posts/{client_id}`
Retrieve all previously generated posts for a client.

---

### `POST /n8n/save-posts`
Receives posts from the n8n automation workflow and saves them to the database.

**Request body:**
```json
{
  "client_id": "uuid",
  "posts": [
    {
      "hook": "...",
      "caption": "...",
      "call_to_action": "...",
      "hashtags": ["#tag1"],
      "image_prompt": "...",
      "image_url": "...",
      "emotional_trigger": "urgency",
      "content_type": "educational"
    }
  ]
}
```

---

### `GET /health`
Server health check.

---

## Content Types (Auto-rotated)

| Type | Goal |
|---|---|
| `educational` | Teach one thing the audience didn't know |
| `authority` | Position the brand as the industry expert |
| `social_proof` | Show real client results and transformations |
| `problem_solution` | Name a painful problem and offer the fix |
| `behind_the_scenes` | Build trust through process transparency |

---

## n8n Automation Workflow

Import `n8n/workflow.json` into your n8n instance to run automated content generation.

```mermaid
flowchart LR
    W["1. Webhook<br/>POST /generate-content"] --> FC["2. Fetch Client<br/>GET /clients/{id}"]
    FC --> BP["3. Build Prompt<br/>Code: construct prompts"]
    BP --> GT["4. Generate Text<br/>POST → OpenRouter"]
    GT --> PP["5. Parse Posts<br/>Code: extract JSON"]
    PP --> GI["6. Generate Images<br/>Code: image per post"]
    GI --> SP["7. Save Posts<br/>POST → /n8n/save-posts"]
    SP --> RW["8. Respond to Webhook<br/>{success, total, posts}"]
```

### What it does

1. **Webhook** — receives `{ client_id }` via POST
2. **Fetch Client** — gets the full client profile from the backend
3. **Build Prompt** — assembles system + user prompts from client fields (name, industry, tone, services, audience, etc.)
4. **Generate Text** — calls OpenRouter with `google/gemini-2.5-flash-lite`, JSON mode
5. **Parse Posts** — strips markdown fences, `JSON.parse`s the response, extracts `posts[]`
6. **Generate Images** — iterates posts, calls OpenRouter Gemini image model for each `image_prompt`, falls back to placeholder on failure
7. **Save Posts** — POSTs completed posts to the backend (`/n8n/save-posts`)
8. **Respond to Webhook** — returns `{ success, client_id, total, posts }`

### Setup

Set these environment variables in n8n (Settings → Environment Variables):

| Variable | Value |
|---|---|
| `OPENROUTER_API_KEY` | your OpenRouter API key |
| `OPENROUTER_TEXT_MODEL` | `google/gemini-2.5-flash-lite` |
| `OPENROUTER_IMAGE_MODEL` | `google/gemini-2.5-flash-image` |
| `BACKEND_URL` | `http://localhost:8000` (local) or `https://ai-content-engine-api.fly.dev` (prod) |

### Trigger

Send a POST request to the webhook URL:
```json
{ "client_id": "your-client-uuid" }
```

---

## Using PostgreSQL (Production)

Switch the database by updating `.env`:

```env
DATABASE_URL=postgresql+asyncpg://user:password@host/content_engine
```

No code changes required. Tables are auto-created on startup.

---

## Image Generation Notes

Images are generated via **Gemini 2.5 Flash Image** through OpenRouter's chat completions endpoint (`/api/v1/chat/completions`). The model returns images as base64 data URIs (`data:image/png;base64,...`), which browsers render natively in `<img src>` tags.

Image generation uses a retry wrapper with exponential backoff (1s → 2s → 4s, max 3 attempts). If all attempts fail, `image_url` is saved as `null` — the post is still saved with all text content intact.
