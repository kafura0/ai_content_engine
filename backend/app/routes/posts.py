from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.schemas.content import PostOut
from app.services.client_service import get_client_by_owner, get_posts_for_client

router = APIRouter(prefix="/posts", tags=["posts"])


@router.get("/{client_id}", response_model=list[PostOut])
async def get_client_posts(
    client_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
) -> list[PostOut]:
    client = await get_client_by_owner(db, client_id, user_id)
    if not client:
        raise HTTPException(status_code=404, detail=f"Client '{client_id}' not found.")

    posts = await get_posts_for_client(db, client_id)
    return [PostOut.model_validate(p) for p in posts]
