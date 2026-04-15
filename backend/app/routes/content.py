import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.services.client_service import get_client

router = APIRouter(tags=["content"])


@router.post("/trigger-generation/{client_id}")
async def trigger_generation(
    client_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Trigger n8n workflow to generate content for a client."""
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
