from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.schemas.client import ClientCreate, ClientListResponse, ClientResponse, ClientUpdate
from app.services.client_service import (
    count_posts_this_month,
    create_client,
    delete_client,
    get_client_by_owner,
    list_clients,
    set_client_active,
)

router = APIRouter(prefix="/clients", tags=["clients"])


@router.post("", response_model=ClientResponse, status_code=201)
async def create_new_client(
    data: ClientCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
) -> ClientResponse:
    client = await create_client(db, data, owner_id=user_id)
    return ClientResponse.model_validate(client)


@router.get("", response_model=ClientListResponse)
async def get_all_clients(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
) -> ClientListResponse:
    clients = await list_clients(db, owner_id=user_id)
    return ClientListResponse(
        clients=[ClientResponse.model_validate(c) for c in clients],
        total=len(clients),
    )


@router.get("/{client_id}/quota")
async def get_client_quota(
    client_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
) -> dict:
    client = await get_client_by_owner(db, client_id, user_id)
    if not client:
        raise HTTPException(status_code=404, detail=f"Client '{client_id}' not found.")
    used = await count_posts_this_month(db, client_id)
    return {
        "used": used,
        "limit": client.monthly_post_quota,
        "remaining": max(0, client.monthly_post_quota - used),
    }


@router.get("/{client_id}", response_model=ClientResponse)
async def get_single_client(
    client_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
) -> ClientResponse:
    client = await get_client_by_owner(db, client_id, user_id)
    if not client:
        raise HTTPException(status_code=404, detail=f"Client '{client_id}' not found.")
    return ClientResponse.model_validate(client)


@router.patch("/{client_id}", response_model=ClientResponse)
async def update_client_status(
    client_id: str,
    data: ClientUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
) -> ClientResponse:
    client = await get_client_by_owner(db, client_id, user_id)
    if not client:
        raise HTTPException(status_code=404, detail=f"Client '{client_id}' not found.")
    updated = await set_client_active(db, client_id, data.is_active)
    return ClientResponse.model_validate(updated)


@router.delete("/{client_id}", status_code=204)
async def delete_client_route(
    client_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
) -> None:
    client = await get_client_by_owner(db, client_id, user_id)
    if not client:
        raise HTTPException(status_code=404, detail=f"Client '{client_id}' not found.")
    await delete_client(db, client_id)
