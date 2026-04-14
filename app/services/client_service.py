from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.client import Client
from app.schemas.client import ClientCreate


async def create_client(db: AsyncSession, data: ClientCreate) -> Client:
    raw = data.model_dump()
    # Pydantic serialises BrandColors to a dict automatically; JSON column accepts it
    client = Client(**raw)
    db.add(client)
    await db.commit()
    await db.refresh(client)
    return client


async def get_client(db: AsyncSession, client_id: str) -> Client | None:
    return await db.get(Client, client_id)


async def list_clients(db: AsyncSession) -> list[Client]:
    result = await db.execute(select(Client).order_by(Client.created_at.desc()))
    return list(result.scalars().all())
