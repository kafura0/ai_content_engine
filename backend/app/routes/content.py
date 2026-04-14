from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.content import ContentResponse, PostOut
from app.services.client_service import get_client
from app.services.content_generator import generate_content_for_client

router = APIRouter(tags=["content"])


@router.post("/generate-content/{client_id}", response_model=ContentResponse)
async def generate_content(
    client_id: str,
    count: int = Query(default=5, ge=1, le=10, description="Number of posts to generate"),
    db: AsyncSession = Depends(get_db),
) -> ContentResponse:
    client = await get_client(db, client_id)
    if not client:
        raise HTTPException(status_code=404, detail=f"Client '{client_id}' not found.")

    posts = await generate_content_for_client(db, client, count)

    return ContentResponse(
        client_id=client.id,
        client_name=client.name,
        posts=[PostOut.model_validate(p) for p in posts],
    )
