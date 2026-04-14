from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.database import create_tables
from app.routes.clients import router as clients_router
from app.routes.content import router as content_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    yield


app = FastAPI(
    title="AI Content Engine",
    description=(
        "Multi-client social media content engine powered by Claude + Nanobanana 3 "
        "via OpenRouter. Generates viral posts with AI images per client brand profile."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

app.include_router(clients_router)
app.include_router(content_router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={"detail": f"Unexpected server error: {str(exc)}"},
    )


@app.get("/health", tags=["system"])
async def health() -> dict:
    return {"status": "ok", "version": "2.0.0"}
