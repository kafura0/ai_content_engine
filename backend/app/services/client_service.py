from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.client import Client
from app.models.post import Post
from app.schemas.client import ClientCreate, ClientEdit


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


async def update_client(
    db: AsyncSession, client_id: str, data: ClientEdit
) -> Client | None:
    client = await db.get(Client, client_id)
    if not client:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(client, field, value)
    await db.commit()
    await db.refresh(client)
    return client


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


async def get_stats(db: AsyncSession, owner_id: str) -> dict:
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    clients_result = await db.execute(
        select(func.count()).where(Client.owner_id == owner_id)
    )
    total_clients = clients_result.scalar() or 0

    active_result = await db.execute(
        select(func.count()).where(Client.owner_id == owner_id, Client.is_active == True)
    )
    active_clients = active_result.scalar() or 0

    # Subquery: client IDs owned by this user
    owned_ids = select(Client.id).where(Client.owner_id == owner_id).scalar_subquery()

    posts_month_result = await db.execute(
        select(func.count()).where(
            Post.client_id.in_(owned_ids),
            Post.created_at >= month_start,
        )
    )
    posts_this_month = posts_month_result.scalar() or 0

    total_posts_result = await db.execute(
        select(func.count()).where(Post.client_id.in_(owned_ids))
    )
    total_posts = total_posts_result.scalar() or 0

    return {
        "total_clients": total_clients,
        "active_clients": active_clients,
        "posts_this_month": posts_this_month,
        "total_posts": total_posts,
    }


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
