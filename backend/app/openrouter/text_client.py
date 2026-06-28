import json

import httpx
from fastapi import HTTPException

from app.config import settings

_URL = "https://openrouter.ai/api/v1/chat/completions"
_TIMEOUT = httpx.Timeout(120.0, connect=10.0)
_HEADERS = {
    "Authorization": f"Bearer {settings.openrouter_api_key}",
    "Content-Type": "application/json",
    "HTTP-Referer": "https://ai-content-engine",
    "X-Title": "AI Content Engine",
}


async def chat_completion(system_prompt: str, user_prompt: str) -> dict:
    payload = {
        "model": settings.openrouter_text_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.85,
        "max_tokens": 2048,
        "response_format": {"type": "json_object"},
    }

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        try:
            response = await client.post(_URL, headers=_HEADERS, json=payload)
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="OpenRouter text request timed out.")
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=f"Network error: {exc}")

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"OpenRouter error: {response.text}",
        )

    raw = response.json()["choices"][0]["message"]["content"]

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502,
            detail="Model returned non-JSON. Preview: " + raw[:300],
        )
