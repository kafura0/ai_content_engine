import asyncio

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.client import Client
from app.models.post import Post
from app.openrouter.text_client import chat_completion
from app.prompts.content_prompts import SYSTEM_PROMPT, build_viral_prompt
from app.services.image_generator import generate_image_with_retry


async def generate_content_for_client(
    db: AsyncSession,
    client: Client,
    count: int = 5,
) -> list[Post]:
    # 1. Build the viral prompt from the full client profile
    user_prompt = build_viral_prompt(client, count)

    # 2. Generate all post text in one LLM call
    data = await chat_completion(SYSTEM_PROMPT, user_prompt)

    raw_posts: list = data.get("posts", [])
    if not isinstance(raw_posts, list) or len(raw_posts) == 0:
        raise HTTPException(
            status_code=502,
            detail="Model response missing 'posts' array.",
        )

    # 3. Generate all images concurrently (failures return None, never abort)
    image_prompts = [p.get("image_prompt", "") for p in raw_posts]
    image_urls: list[str | None] = list(
        await asyncio.gather(
            *[generate_image_with_retry(prompt) for prompt in image_prompts]
        )
    )

    # 4. Build ORM Post objects
    posts: list[Post] = []
    for raw, image_url in zip(raw_posts, image_urls):
        post = Post(
            client_id=client.id,
            hook=raw.get("hook", ""),
            caption=raw.get("caption", ""),
            emotional_trigger=raw.get("emotional_trigger"),
            call_to_action=raw.get("call_to_action", ""),
            hashtags=raw.get("hashtags", []),
            image_prompt=raw.get("image_prompt", ""),
            image_url=image_url,
            content_type=raw.get("content_type"),
        )
        posts.append(post)

    # 5. Persist all posts in a single transaction
    db.add_all(posts)
    await db.commit()

    for post in posts:
        await db.refresh(post)

    return posts
