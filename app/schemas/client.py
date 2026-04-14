from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BrandColors(BaseModel):
    primary: str = Field(..., description="Hex color, e.g. #1A2B3C")
    secondary: str = Field(..., description="Hex color, e.g. #FFFFFF")


class ClientCreate(BaseModel):
    name: str = Field(..., min_length=1)
    industry: str = Field(..., min_length=1)
    tone_of_voice: str = Field(
        ...,
        description="e.g. professional, casual, premium, playful, bold, inspirational",
    )
    brand_colors: BrandColors | None = None
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


class ClientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    industry: str
    tone_of_voice: str
    brand_colors: dict | None
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
