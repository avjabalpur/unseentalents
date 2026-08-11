import uuid

from fastapi import APIRouter, Depends, File, UploadFile
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.dependencies import require_role
from app.db import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.event_type import EventTypeCreate, EventTypeRead, EventTypeUpdate
from app.services import event_type_service

router = APIRouter(prefix="/event-types", tags=["event-types"])


@router.get("", response_model=list[EventTypeRead])
async def list_event_types(db: AsyncSession = Depends(get_db)):
    return await event_type_service.list_event_types(db)


@router.post("", response_model=EventTypeRead)
async def create_event_type(
    payload: EventTypeCreate,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    return await event_type_service.create_event_type(db, payload)


@router.patch("/{event_type_id}", response_model=EventTypeRead)
async def update_event_type(
    event_type_id: uuid.UUID,
    payload: EventTypeUpdate,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    event_type = await event_type_service.get_event_type_or_404(db, event_type_id)
    return await event_type_service.update_event_type(db, event_type, payload)


@router.delete("/{event_type_id}", status_code=204)
async def delete_event_type(
    event_type_id: uuid.UUID,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    event_type = await event_type_service.get_event_type_or_404(db, event_type_id)
    await event_type_service.delete_event_type(db, event_type)


@router.post("/{event_type_id}/image", response_model=EventTypeRead)
async def upload_event_type_image(
    event_type_id: uuid.UUID,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
    file: UploadFile = File(...),
):
    event_type = await event_type_service.get_event_type_or_404(db, event_type_id)
    return await event_type_service.upload_image(db, event_type, file)
