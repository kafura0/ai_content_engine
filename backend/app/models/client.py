import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.post import Post


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    industry: Mapped[str] = mapped_column(String(255), nullable=False)
    tone_of_voice: Mapped[str] = mapped_column(String(100), nullable=False)
    brand_colors: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    image_style: Mapped[str | None] = mapped_column(String(100), nullable=True)
    target_audience: Mapped[str | None] = mapped_column(String(500), nullable=True)
    services: Mapped[list | None] = mapped_column(JSON, nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    posting_goals: Mapped[list | None] = mapped_column(JSON, nullable=True)
    audience_pain_points: Mapped[list | None] = mapped_column(JSON, nullable=True)
    unique_selling_points: Mapped[list | None] = mapped_column(JSON, nullable=True)
    past_wins: Mapped[list | None] = mapped_column(JSON, nullable=True)
    platforms: Mapped[list | None] = mapped_column(JSON, nullable=True)
    price_positioning: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # Brand identity
    brand_tagline: Mapped[str | None] = mapped_column(String(500), nullable=True)
    words_to_avoid: Mapped[list | None] = mapped_column(JSON, nullable=True)
    founding_story: Mapped[str | None] = mapped_column(Text, nullable=True)
    cta_destination: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # Operational
    monthly_post_quota: Mapped[int] = mapped_column(Integer, nullable=False, default=20)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Publishing / scheduling
    timezone: Mapped[str] = mapped_column(String(100), nullable=False, default="UTC")
    facebook_page_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    instagram_account_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tiktok_account_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    # Auth: UUID of the Supabase user who owns this client (nullable for legacy rows)
    owner_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    # Publishing: Meta (Facebook/Instagram) Page Access Token
    meta_access_token: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    posts: Mapped[list["Post"]] = relationship(
        "Post", back_populates="client", cascade="all, delete-orphan"
    )
