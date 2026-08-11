import uuid
from pathlib import Path

from fastapi import UploadFile, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.errors import AppError
from app.models.event import Event
from app.models.event_type import EventType
from app.schemas.event_type import EventTypeCreate, EventTypeUpdate
from app.storage.local import get_storage_backend


async def list_event_types(db: AsyncSession) -> list[EventType]:
    result = await db.exec(select(EventType).order_by(EventType.name))
    return list(result.all())


async def get_event_type_or_404(db: AsyncSession, event_type_id: uuid.UUID) -> EventType:
    event_type = await db.get(EventType, event_type_id)
    if event_type is None:
        raise AppError("NOT_FOUND", "Event type not found.", status.HTTP_404_NOT_FOUND)
    return event_type


async def create_event_type(db: AsyncSession, data: EventTypeCreate) -> EventType:
    existing = await db.exec(select(EventType).where(EventType.name == data.name))
    if existing.first() is not None:
        raise AppError("EVENT_TYPE_EXISTS", "An event type with this name already exists.", status.HTTP_409_CONFLICT)

    event_type = EventType(**data.model_dump())
    db.add(event_type)
    await db.commit()
    await db.refresh(event_type)
    return event_type


async def set_event_type_image(db: AsyncSession, event_type: EventType, image_key: str) -> EventType:
    event_type.image_key = image_key
    db.add(event_type)
    await db.commit()
    await db.refresh(event_type)
    return event_type


async def upload_image(db: AsyncSession, event_type: EventType, file: UploadFile) -> EventType:
    storage = get_storage_backend()
    extension = Path(file.filename or "").suffix.lower() or ".jpg"
    key = f"event-type-images/{event_type.id}{extension}"
    await storage.save(file, key)
    return await set_event_type_image(db, event_type, key)


async def update_event_type(db: AsyncSession, event_type: EventType, data: EventTypeUpdate) -> EventType:
    updates = data.model_dump(exclude_unset=True)
    if "name" in updates and updates["name"] != event_type.name:
        existing = await db.exec(select(EventType).where(EventType.name == updates["name"]))
        if existing.first() is not None:
            raise AppError(
                "EVENT_TYPE_EXISTS", "An event type with this name already exists.", status.HTTP_409_CONFLICT
            )
    for field, value in updates.items():
        setattr(event_type, field, value)
    db.add(event_type)
    await db.commit()
    await db.refresh(event_type)
    return event_type


async def delete_event_type(db: AsyncSession, event_type: EventType) -> None:
    in_use = await db.exec(select(Event).where(Event.event_type_id == event_type.id).limit(1))
    if in_use.first() is not None:
        raise AppError(
            "EVENT_TYPE_IN_USE",
            "This event type is used by at least one event and can't be deleted.",
            status.HTTP_409_CONFLICT,
        )
    await db.delete(event_type)
    await db.commit()
