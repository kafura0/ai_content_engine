from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# asyncpg requires an explicit ssl context for Supabase / managed PostgreSQL.
# SQLite connections ignore connect_args, so this is safe in both environments.
_connect_args: dict = {}
if settings.database_url.startswith("postgresql"):
    import ssl as _ssl
    _ssl_ctx = _ssl.create_default_context()
    # Supabase pooler (Supavisor) uses a self-signed cert in the chain.
    # Disabling verification is standard practice for pooler connections.
    _ssl_ctx.check_hostname = False
    _ssl_ctx.verify_mode = _ssl.CERT_NONE
    _connect_args["ssl"] = _ssl_ctx
    # Supabase transaction pooler doesn't support prepared statements
    _connect_args["statement_cache_size"] = 0

engine = create_async_engine(settings.database_url, echo=False, connect_args=_connect_args)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


async def create_tables() -> None:
    # app/models/__init__.py must be imported before this runs
    # so all ORM classes are registered on Base.metadata
    from app import models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
