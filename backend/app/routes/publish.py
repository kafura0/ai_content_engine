from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.post import Post
from app.schemas.content import PostOut
from app.services.client_service import get_client_by_owner
from app.services.publisher import publish_to_facebook, publish_to_instagram

router = APIRouter(tags=["publish"])


class PublishRequest(BaseModel):
    platform: str  # "facebook" | "instagram"


@router.post("/posts/{post_id}/publish", response_model=PostOut)
async def publish_post(
    post_id: str,
    body: PublishRequest,
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

    if not client.meta_access_token:
        raise HTTPException(
            status_code=400,
            detail="No Meta access token configured for this client. Add it in the client profile.",
        )

    message = "\n\n".join(filter(None, [
        post.hook,
        post.caption,
        post.call_to_action,
        " ".join(post.hashtags or []),
    ]))

    if body.platform == "facebook":
        if not client.facebook_page_id:
            raise HTTPException(status_code=400, detail="No Facebook Page ID configured.")
        await publish_to_facebook(client.facebook_page_id, client.meta_access_token, message)

    elif body.platform == "instagram":
        if not client.instagram_account_id:
            raise HTTPException(status_code=400, detail="No Instagram Account ID configured.")
        if not post.image_url:
            raise HTTPException(
                status_code=400,
                detail="This post has no image URL. Instagram requires an image.",
            )
        caption = "\n\n".join(filter(None, [
            post.hook,
            post.caption,
            post.call_to_action,
            " ".join(post.hashtags or []),
        ]))
        await publish_to_instagram(
            client.instagram_account_id, client.meta_access_token, post.image_url, caption
        )

    else:
        raise HTTPException(
            status_code=400,
            detail=f"Platform '{body.platform}' is not supported. Use 'facebook' or 'instagram'.",
        )

    published_to = list(post.published_to or [])
    if body.platform not in published_to:
        published_to.append(body.platform)
    post.published_to = published_to
    post.published_at = datetime.utcnow()
    await db.commit()
    await db.refresh(post)

    return PostOut.model_validate(post)
