import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.config import settings
from app.database import get_db
from app.schemas.content import ContentResponse, PostOut
from app.services.client_service import count_posts_this_month, get_client_by_owner
from app.services.content_generator import generate_content_for_client

router = APIRouter(tags=["content"])


@router.post("/generate-content/{client_id}", response_model=ContentResponse)
async def generate_content(
    client_id: str,
    count: int = Query(default=5, ge=1, le=10),
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
) -> ContentResponse:
    client = await get_client_by_owner(db, client_id, user_id)
    if not client:
        raise HTTPException(status_code=404, detail=f"Client '{client_id}' not found.")
    if not client.is_active:
        raise HTTPException(
            status_code=403,
            detail=f"Client '{client.name}' is inactive. Activate the client to generate content.",
        )

    used = await count_posts_this_month(db, client_id)
    if used + count > client.monthly_post_quota:
        remaining = max(0, client.monthly_post_quota - used)
        raise HTTPException(
            status_code=429,
            detail=(
                f"Quota exceeded: {used}/{client.monthly_post_quota} posts used this month. "
                f"{remaining} remaining."
            ),
        )

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
    user_id: str = Depends(get_current_user),
) -> dict:
    client = await get_client_by_owner(db, client_id, user_id)
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
