import httpx
from fastapi import HTTPException

META_GRAPH = "https://graph.facebook.com/v19.0"


async def publish_to_facebook(page_id: str, access_token: str, message: str) -> str:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f"{META_GRAPH}/{page_id}/feed",
            json={"message": message, "access_token": access_token},
        )
        if not r.is_success:
            error = r.json().get("error", {}).get("message", r.text)
            raise HTTPException(status_code=502, detail=f"Facebook API error: {error}")
        return r.json()["id"]


async def publish_to_instagram(
    ig_user_id: str, access_token: str, image_url: str, caption: str
) -> str:
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Step 1: create media container
        r1 = await client.post(
            f"{META_GRAPH}/{ig_user_id}/media",
            json={"image_url": image_url, "caption": caption, "access_token": access_token},
        )
        if not r1.is_success:
            error = r1.json().get("error", {}).get("message", r1.text)
            raise HTTPException(status_code=502, detail=f"Instagram media creation error: {error}")
        creation_id = r1.json()["id"]

        # Step 2: publish the container
        r2 = await client.post(
            f"{META_GRAPH}/{ig_user_id}/media_publish",
            json={"creation_id": creation_id, "access_token": access_token},
        )
        if not r2.is_success:
            error = r2.json().get("error", {}).get("message", r2.text)
            raise HTTPException(status_code=502, detail=f"Instagram publish error: {error}")
        return r2.json()["id"]
