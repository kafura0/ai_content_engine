from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.client import ClientCreate, ClientListResponse, ClientResponse, ClientUpdate
from app.services.client_service import create_client, delete_client, get_client, list_clients, set_client_active

router = APIRouter(prefix="/clients", tags=["clients"])


@router.post("", response_model=ClientResponse, status_code=201)
async def create_new_client(
    data: ClientCreate,
    db: AsyncSession = Depends(get_db),
) -> ClientResponse:
    client = await create_client(db, data)
    return ClientResponse.model_validate(client)


@router.get("", response_model=ClientListResponse)
async def get_all_clients(
    db: AsyncSession = Depends(get_db),
) -> ClientListResponse:
    clients = await list_clients(db)
    return ClientListResponse(
        clients=[ClientResponse.model_validate(c) for c in clients],
        total=len(clients),
    )


@router.get("/{client_id}", response_model=ClientResponse)
async def get_single_client(
    client_id: str,
    db: AsyncSession = Depends(get_db),
) -> ClientResponse:
    client = await get_client(db, client_id)
    if not client:
        raise HTTPException(status_code=404, detail=f"Client '{client_id}' not found.")
    return ClientResponse.model_validate(client)


@router.patch("/{client_id}", response_model=ClientResponse)
async def update_client_status(
    client_id: str,
    data: ClientUpdate,
    db: AsyncSession = Depends(get_db),
) -> ClientResponse:
    client = await set_client_active(db, client_id, data.is_active)
    if not client:
        raise HTTPException(status_code=404, detail=f"Client '{client_id}' not found.")
    return ClientResponse.model_validate(client)


@router.delete("/{client_id}", status_code=204)
async def delete_client_route(
    client_id: str,
    db: AsyncSession = Depends(get_db),
) -> None:
    client = await get_client(db, client_id)
    if not client:
        raise HTTPException(status_code=404, detail=f"Client '{client_id}' not found.")
    await delete_client(db, client_id)
