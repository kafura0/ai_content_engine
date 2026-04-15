from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ClientCreate(BaseModel):
    name: str = Field(..., min_length=1)
    industry: str = Field(..., min_length=1)
    tone_of_voice: str = Field(
        ...,
        description="e.g. professional, casual, premium, playful, bold, inspirational",
    )
    brand_colors: list[str] | None = Field(
        None,
        description="Array of hex color strings, max 10",
    )
    logo_url: str | None = None
    image_style: str | None = Field(
        None,
        description="e.g. cinematic, realistic, minimal, bold, editorial, lifestyle",
    )
    target_audience: str | None = None
    services: list[str] = Field(..., min_length=1)
    location: str | None = None
    posting_goals: list[str] = Field(
        ...,
        min_length=1,
        description="e.g. engagement, leads, awareness, retention",
    )

    @field_validator("brand_colors")
    @classmethod
    def max_ten_colors(cls, v: list[str] | None) -> list[str] | None:
        if v is not None and len(v) > 10:
            raise ValueError("brand_colors may contain at most 10 values")
        return v


class ClientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    industry: str
    tone_of_voice: str
    brand_colors: list | None
    logo_url: str | None
    image_style: str | None
    target_audience: str | None
    services: list | None
    location: str | None
    posting_goals: list | None
    created_at: datetime


class ClientListResponse(BaseModel):
    clients: list[ClientResponse]
    total: int
