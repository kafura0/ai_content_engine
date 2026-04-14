import httpx

from app.config import settings

_URL = "https://openrouter.ai/api/v1/images/generations"
_TIMEOUT = httpx.Timeout(120.0, connect=10.0)
_HEADERS = {
    "Authorization": f"Bearer {settings.openrouter_api_key}",
    "Content-Type": "application/json",
    "HTTP-Referer": "https://ai-content-engine",
    "X-Title": "AI Content Engine",
}


async def generate_image(prompt: str) -> str:
    """
    Call OpenRouter image generation endpoint.
    Returns the image URL string.
    Raises on any failure — callers must handle exceptions.
    """
    payload = {
        "model": settings.openrouter_image_model,
        "prompt": prompt,
        "n": 1,
    }

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        response = await client.post(_URL, headers=_HEADERS, json=payload)

    if response.status_code != 200:
        raise RuntimeError(
            f"Image generation failed [{response.status_code}]: {response.text}"
        )

    data = response.json().get("data", [])
    if not data:
        raise RuntimeError("Image generation returned empty data array.")

    url = data[0].get("url")
    if not url:
        raise RuntimeError(f"No URL in image generation response: {data[0]}")

    return url
