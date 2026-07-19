import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, UploadFile
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.dependencies import require_role
from app.db import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.event_type import EventTypeCreate, EventTypeRead
from app.services import event_type_service
from app.storage.local import get_storage_backend

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


@router.post("/{event_type_id}/image", response_model=EventTypeRead)
async def upload_event_type_image(
    event_type_id: uuid.UUID,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
    file: UploadFile = File(...),
):
    event_type = await event_type_service.get_event_type_or_404(db, event_type_id)
    storage = get_storage_backend()
    extension = Path(file.filename or "").suffix.lower() or ".jpg"
    key = f"event-type-images/{event_type_id}{extension}"
    await storage.save(file, key)
    return await event_type_service.set_event_type_image(db, event_type, key)
