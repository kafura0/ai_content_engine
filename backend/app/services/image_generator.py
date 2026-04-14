import asyncio

from app.openrouter.image_client import generate_image

_RETRY_DELAYS = [1, 2, 4]  # exponential backoff in seconds


async def generate_image_with_retry(prompt: str) -> str | None:
    """
    Attempt image generation up to len(_RETRY_DELAYS) + 1 times.
    Returns the image URL on success, or None if all attempts fail.
    Never raises — a failed image must not abort the full content request.
    """
    last_error: Exception | None = None

    for attempt, delay in enumerate(_RETRY_DELAYS):
        try:
            return await generate_image(prompt)
        except Exception as exc:
            last_error = exc
            if attempt < len(_RETRY_DELAYS) - 1:
                await asyncio.sleep(delay)

    # Final attempt after last backoff
    try:
        return await generate_image(prompt)
    except Exception as exc:
        last_error = exc

    print(f"[image_generator] All retries exhausted: {last_error}")
    return None
