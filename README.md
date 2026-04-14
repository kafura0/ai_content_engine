# AI Content Engine

A production-ready multi-client social media content engine powered by **Claude** (text) and **Google Gemini 2.5 Flash** (images) via OpenRouter.

Create a client profile once. Generate viral, brand-consistent social media posts with AI images instantly — via API, dashboard, or automated n8n workflow.

---

## Features

- **Multi-tenant** — unlimited client profiles, fully isolated content per client
- **Viral content** — Claude generates hooks, captions, CTAs, and hashtags tuned to each brand's tone and audience
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
| LLM (text) | Claude 3.5 Haiku via OpenRouter |
| LLM (images) | Google Gemini 2.5 Flash Image via OpenRouter |
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

content_dashboard/          # Next.js 14 frontend
├── app/
│   ├── clients/page.js     # Client management (create, view, browse)
│   ├── generate/page.js    # Generate content per client
│   └── posts/page.js       # Browse saved posts per client
├── components/
│   ├── ClientCard.js       # Client card with brand colors + actions
│   └── PostCard.js         # Post card with image, hook, caption, hashtags
├── lib/api.js              # API wrapper for all backend calls
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
OPENROUTER_TEXT_MODEL=anthropic/claude-3.5-haiku
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
cd content_dashboard
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
  "brand_colors": { "primary": "#FFD700", "secondary": "#1A1A1A" },
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

### What it does

1. Webhook trigger receives a `client_id`
2. Fetches the client profile from FastAPI
3. Builds a viral prompt and sends to Claude via OpenRouter
4. Parses Claude's JSON response into individual posts
5. Loops through posts — generates an image for each via Gemini
6. Saves all completed posts to FastAPI (`POST /n8n/save-posts`)
7. Returns the saved posts as the webhook response

### Setup

Set these environment variables in n8n (Settings → Variables):

```
OPENROUTER_API_KEY   your OpenRouter API key
FASTAPI_BASE_URL     http://127.0.0.1:8000  (or your deployed URL)
```

### Trigger

Send a POST request to the webhook URL with:
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

Images are generated via **Google Gemini 2.5 Flash Image** through OpenRouter's chat completions endpoint (`/api/v1/chat/completions`). The model returns images as base64 data URIs (`data:image/png;base64,...`), which browsers render natively in `<img src>` tags.

Image generation uses a retry wrapper with exponential backoff (1s → 2s → 4s, max 3 attempts). If all attempts fail, `image_url` is saved as `null` — the post is still saved with all text content intact.
