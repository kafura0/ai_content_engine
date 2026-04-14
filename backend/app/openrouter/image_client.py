import httpx

from app.config import settings

_URL = "https://openrouter.ai/api/v1/chat/completions"
_TIMEOUT = httpx.Timeout(120.0, connect=10.0)
_HEADERS = {
    "Authorization": f"Bearer {settings.openrouter_api_key}",
    "Content-Type": "application/json",
    "HTTP-Referer": "https://ai-content-engine",
    "X-Title": "AI Content Engine",
}


async def generate_image(prompt: str) -> str:
    """
    Generate an image via OpenRouter chat completions.
    Returns a data URI (data:image/png;base64,...) or HTTPS URL.
    Raises on any failure.
    """
    payload = {
        "model": settings.openrouter_image_model,
        "messages": [{"role": "user", "content": prompt}],
    }

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        response = await client.post(_URL, headers=_HEADERS, json=payload)

    if response.status_code != 200:
        raise RuntimeError(
            f"Image generation failed [{response.status_code}]: {response.text[:300]}"
        )

    body = response.json()

    # Surface API-level errors returned with a 200 status
    if "error" in body and "choices" not in body:
        raise RuntimeError(f"OpenRouter error: {body['error']}")

    message = body["choices"][0]["message"]

    # Gemini-style: image in message.images[]
    images = message.get("images") or []
    if images:
        url = images[0].get("image_url", {}).get("url")
        if url:
            return url

    # Fallback: image embedded in content array
    content = message.get("content")
    if isinstance(content, list):
        for block in content:
            if block.get("type") == "image_url":
                url = block.get("image_url", {}).get("url")
                if url:
                    return url

    raise RuntimeError(
        f"No image found in response. Keys in message: {list(message.keys())}"
    )
