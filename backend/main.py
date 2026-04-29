from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import create_tables
from app.routes.clients import router as clients_router
from app.routes.content import router as content_router
from app.routes.n8n import router as n8n_router
from app.routes.posts import router as posts_router
from app.routes.publish import router as publish_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    yield


app = FastAPI(
    title="AI Content Engine",
    description=(
        "Multi-client social media content engine powered by Claude + Gemini "
        "via OpenRouter. Generates viral posts with AI images per client brand profile."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

_default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://joat.studio",
    "https://www.joat.studio",
]
_extra = [o.strip() for o in settings.extra_allowed_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_default_origins + _extra,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(clients_router)
app.include_router(content_router)
app.include_router(posts_router)
app.include_router(n8n_router)
app.include_router(publish_router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={"detail": f"Unexpected server error: {str(exc)}"},
    )


@app.get("/health", tags=["system"])
async def health() -> dict:
    return {"status": "ok", "version": "2.0.0"}
