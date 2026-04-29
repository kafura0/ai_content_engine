from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.post import Post
from app.schemas.content import PostEdit, PostOut
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


@router.patch("/{post_id}/edit", response_model=PostOut)
async def edit_post(
    post_id: str,
    data: PostEdit,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
) -> PostOut:
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    client = await get_client_by_owner(db, post.client_id, user_id)
    if not client:
        raise HTTPException(status_code=403, detail="Access denied.")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(post, field, value)
    await db.commit()
    await db.refresh(post)

    return PostOut.model_validate(post)
