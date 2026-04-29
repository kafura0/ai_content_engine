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
    audience_pain_points: list[str] | None = Field(
        None,
        description="Specific frustrations the target audience faces",
    )
    unique_selling_points: list[str] | None = Field(
        None,
        description="What makes this client different from competitors",
    )
    past_wins: list[str] | None = Field(
        None,
        description="Real outcomes, numbers, or achievements to reference",
    )
    platforms: list[str] | None = Field(
        None,
        description="e.g. instagram, linkedin, facebook, tiktok",
    )
    price_positioning: str | None = Field(
        None,
        description="budget / mid-range / premium / luxury",
    )
    # Brand identity
    brand_tagline: str | None = None
    words_to_avoid: list[str] | None = Field(
        None,
        description="Words, phrases, or competitor names the AI must never use",
    )
    founding_story: str | None = Field(
        None,
        description="Short origin story — used in behind-the-scenes posts",
    )
    cta_destination: str | None = Field(
        None,
        description="URL, phone number, or WhatsApp link for CTAs",
    )
    # Operational
    monthly_post_quota: int = Field(
        default=20,
        ge=1,
        description="Max posts to generate per month for this client",
    )
    notes: str | None = Field(
        None,
        description="Internal notes — not sent to the AI",
    )
    # Publishing / scheduling
    timezone: str = Field(
        default="UTC",
        description="IANA timezone, e.g. Africa/Nairobi",
    )
    facebook_page_id: str | None = None
    instagram_account_id: str | None = None
    tiktok_account_id: str | None = None
    meta_access_token: str | None = Field(
        None,
        description="Meta (Facebook/Instagram) Page Access Token for publishing",
    )

    @field_validator("brand_colors")
    @classmethod
    def max_ten_colors(cls, v: list[str] | None) -> list[str] | None:
        if v is not None and len(v) > 10:
            raise ValueError("brand_colors may contain at most 10 values")
        return v


class ClientUpdate(BaseModel):
    is_active: bool


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
    audience_pain_points: list | None
    unique_selling_points: list | None
    past_wins: list | None
    platforms: list | None
    price_positioning: str | None
    brand_tagline: str | None
    words_to_avoid: list | None
    founding_story: str | None
    cta_destination: str | None
    monthly_post_quota: int
    notes: str | None
    timezone: str
    facebook_page_id: str | None
    instagram_account_id: str | None
    tiktok_account_id: str | None
    meta_access_token: str | None
    is_active: bool
    owner_id: str | None
    created_at: datetime


class ClientListResponse(BaseModel):
    clients: list[ClientResponse]
    total: int
