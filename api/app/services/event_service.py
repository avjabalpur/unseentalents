import uuid
from datetime import datetime, timezone

from fastapi import status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.errors import AppError
from app.models.enums import EventStatus
from app.models.event import Event
from app.models.participation import Participation
from app.models.prize import Prize
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


async def list_all_events(db: AsyncSession, limit: int | None = None, offset: int = 0) -> list[Event]:
    query = select(Event).order_by(Event.created_at.desc()).offset(offset)
    if limit is not None:
        query = query.limit(limit)
    result = await db.exec(query)
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


async def delete_event(db: AsyncSession, event: Event) -> None:
    in_use = await db.exec(select(Participation).where(Participation.event_id == event.id).limit(1))
    if in_use.first() is not None:
        raise AppError(
            "EVENT_HAS_PARTICIPANTS",
            "This event already has participants and can't be deleted — archive it instead.",
            status.HTTP_409_CONFLICT,
        )
    # No participations means no submissions/votes/stage results reference this event's
    # stages either, so it's safe to clear stages and prizes before removing the event itself.
    stages = await db.exec(select(Stage).where(Stage.event_id == event.id))
    for stage in stages.all():
        await db.delete(stage)
    prizes = await db.exec(select(Prize).where(Prize.event_id == event.id))
    for prize in prizes.all():
        await db.delete(prize)
    await db.delete(event)
    await db.commit()
