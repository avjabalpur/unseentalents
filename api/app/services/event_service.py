import uuid
from datetime import datetime, timezone

from fastapi import status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.errors import AppError
from app.models.enums import EventStatus
from app.models.event import Event
from app.models.stage import Stage
from app.models.user import User
from app.schemas.event import EventCreate, EventUpdate


def compute_event_status(stages: list[Stage], now: datetime | None = None) -> str:
    now = now or datetime.now(timezone.utc)
    if not stages:
        return "UPCOMING"
    ordered = sorted(stages, key=lambda s: s.order_index)
    if now < ordered[0].start_at:
        return "UPCOMING"
    if now > ordered[-1].end_at:
        return "CLOSED"
    return "ONGOING"


async def list_published_events(db: AsyncSession) -> list[Event]:
    result = await db.exec(
        select(Event).where(Event.status == EventStatus.PUBLISHED).order_by(Event.created_at.desc())
    )
    return list(result.all())


async def list_all_events(db: AsyncSession) -> list[Event]:
    result = await db.exec(select(Event).order_by(Event.created_at.desc()))
    return list(result.all())


async def get_event_or_404(db: AsyncSession, event_id: uuid.UUID) -> Event:
    event = await db.get(Event, event_id)
    if event is None:
        raise AppError("NOT_FOUND", "Event not found.", status.HTTP_404_NOT_FOUND)
    return event


async def create_event(db: AsyncSession, data: EventCreate, admin: User) -> Event:
    event = Event(**data.model_dump(), created_by=admin.id)
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


async def update_event(db: AsyncSession, event: Event, data: EventUpdate) -> Event:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    event.updated_at = datetime.now(timezone.utc)
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event
