from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PostOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    client_id: str
    hook: str
    caption: str
    emotional_trigger: str | None
    call_to_action: str
    hashtags: list | None
    image_prompt: str
    image_url: str | None
    content_type: str | None
    created_at: datetime


class ContentResponse(BaseModel):
    client_id: str
    client_name: str
    posts: list[PostOut]
