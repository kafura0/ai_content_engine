from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.client import Client
from app.models.post import Post
from app.schemas.client import ClientCreate


async def create_client(db: AsyncSession, data: ClientCreate, owner_id: str) -> Client:
    raw = data.model_dump()
    client = Client(**raw, owner_id=owner_id)
    db.add(client)
    await db.commit()
    await db.refresh(client)
    return client


async def get_client(db: AsyncSession, client_id: str) -> Client | None:
    return await db.get(Client, client_id)


async def get_client_by_owner(
    db: AsyncSession, client_id: str, owner_id: str
) -> Client | None:
    result = await db.execute(
        select(Client).where(Client.id == client_id, Client.owner_id == owner_id)
    )
    return result.scalar_one_or_none()


async def list_clients(db: AsyncSession, owner_id: str) -> list[Client]:
    result = await db.execute(
        select(Client)
        .where(Client.owner_id == owner_id)
        .order_by(Client.created_at.desc())
    )
    return list(result.scalars().all())


async def set_client_active(
    db: AsyncSession, client_id: str, is_active: bool
) -> Client | None:
    client = await db.get(Client, client_id)
    if not client:
        return None
    client.is_active = is_active
    await db.commit()
    await db.refresh(client)
    return client


async def delete_client(db: AsyncSession, client_id: str) -> None:
    client = await db.get(Client, client_id)
    if client:
        await db.delete(client)
        await db.commit()


async def get_posts_for_client(db: AsyncSession, client_id: str) -> list[Post]:
    result = await db.execute(
        select(Post)
        .where(Post.client_id == client_id)
        .order_by(Post.created_at.desc())
    )
    return list(result.scalars().all())


async def count_posts_this_month(db: AsyncSession, client_id: str) -> int:
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    result = await db.execute(
        select(func.count()).where(
            Post.client_id == client_id,
            Post.created_at >= month_start,
        )
    )
    return result.scalar() or 0
