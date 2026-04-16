import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.schemas.content import ContentResponse, PostOut
from app.services.client_service import get_client
from app.services.content_generator import generate_content_for_client

router = APIRouter(tags=["content"])


@router.post("/generate-content/{client_id}", response_model=ContentResponse)
async def generate_content(
    client_id: str,
    count: int = Query(default=5, ge=1, le=10),
    db: AsyncSession = Depends(get_db),
) -> ContentResponse:
    """Generate content directly via OpenRouter (no n8n)."""
    client = await get_client(db, client_id)
    if not client:
        raise HTTPException(status_code=404, detail=f"Client '{client_id}' not found.")

    posts = await generate_content_for_client(db, client, count)

    return ContentResponse(
        client_id=client.id,
        client_name=client.name,
        posts=[PostOut.model_validate(p) for p in posts],
    )


@router.post("/trigger-generation/{client_id}")
async def trigger_generation(
    client_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Trigger n8n workflow to generate content (async)."""
    client = await get_client(db, client_id)
    if not client:
        raise HTTPException(status_code=404, detail=f"Client '{client_id}' not found.")

    if not settings.n8n_webhook_url:
        raise HTTPException(status_code=503, detail="N8N_WEBHOOK_URL is not configured.")

    async with httpx.AsyncClient(timeout=10.0) as http:
        try:
            response = await http.post(
                settings.n8n_webhook_url,
                json={"client_id": client_id},
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Failed to reach n8n webhook: {exc}",
            )

    return {"status": "processing", "client_id": client_id}
