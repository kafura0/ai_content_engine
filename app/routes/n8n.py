"""
Endpoints used exclusively by the n8n automation workflow.
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.post import Post
from app.schemas.content import ContentResponse, PostOut
from app.services.client_service import get_client

router = APIRouter(prefix="/n8n", tags=["n8n"])


class N8nPost(BaseModel):
    hook: str
    caption: str
    call_to_action: str
    hashtags: list[str] = []
    image_prompt: str
    image_url: str | None = None
    emotional_trigger: str | None = None
    content_type: str | None = None


class N8nSaveRequest(BaseModel):
    client_id: str
    posts: list[N8nPost]


@router.post("/save-posts", response_model=ContentResponse)
async def save_n8n_posts(
    payload: N8nSaveRequest,
    db: AsyncSession = Depends(get_db),
) -> ContentResponse:
    client = await get_client(db, payload.client_id)
    if not client:
        raise HTTPException(status_code=404, detail=f"Client '{payload.client_id}' not found.")

    posts: list[Post] = []
    for p in payload.posts:
        post = Post(
            client_id=client.id,
            hook=p.hook,
            caption=p.caption,
            emotional_trigger=p.emotional_trigger,
            call_to_action=p.call_to_action,
            hashtags=p.hashtags,
            image_prompt=p.image_prompt,
            image_url=p.image_url,
            content_type=p.content_type,
            created_at=datetime.utcnow(),
        )
        posts.append(post)

    db.add_all(posts)
    await db.commit()
    for post in posts:
        await db.refresh(post)

    return ContentResponse(
        client_id=client.id,
        client_name=client.name,
        posts=[PostOut.model_validate(p) for p in posts],
    )
