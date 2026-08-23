import uuid

from fastapi import status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.authz import assert_owner_or_staff
from app.core.errors import AppError
from app.models.event import Event
from app.models.event_judge import EventJudge
from app.models.user import User
from app.schemas.event_judge import EventJudgeRead

MIN_JUDGES = 1
MAX_JUDGES = 5


async def list_judges_for_event(db: AsyncSession, event_id: uuid.UUID) -> list[EventJudge]:
    result = await db.exec(
        select(EventJudge).where(EventJudge.event_id == event_id).order_by(EventJudge.created_at)
    )
    return list(result.all())


async def to_read(db: AsyncSession, judge: EventJudge) -> EventJudgeRead:
    data = EventJudgeRead.model_validate(judge)
    user = await db.get(User, judge.user_id)
    if user is not None:
        data.judge_name = user.name
        data.judge_username = user.username
    return data


async def assign_judge(db: AsyncSession, event: Event, judge_user: User, actor: User) -> EventJudge:
    assert_owner_or_staff(actor, event.created_by)

    existing = await list_judges_for_event(db, event.id)
    if len(existing) >= MAX_JUDGES:
        raise AppError(
            "TOO_MANY_JUDGES", f"An event can have at most {MAX_JUDGES} judges.", status.HTTP_400_BAD_REQUEST
        )
    if any(j.user_id == judge_user.id for j in existing):
        raise AppError("ALREADY_A_JUDGE", "This user is already a judge for this event.", status.HTTP_409_CONFLICT)

    judge = EventJudge(event_id=event.id, user_id=judge_user.id, assigned_by=actor.id)
    db.add(judge)
    await db.commit()
    await db.refresh(judge)
    return judge


async def remove_judge(db: AsyncSession, event: Event, judge: EventJudge, actor: User) -> None:
    assert_owner_or_staff(actor, event.created_by)
    await db.delete(judge)
    await db.commit()


async def get_judge_assignment_or_404(db: AsyncSession, judge_id: uuid.UUID) -> EventJudge:
    judge = await db.get(EventJudge, judge_id)
    if judge is None:
        raise AppError("NOT_FOUND", "Judge assignment not found.", status.HTTP_404_NOT_FOUND)
    return judge


async def is_judge_for_event(db: AsyncSession, event_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    result = await db.exec(
        select(EventJudge).where(EventJudge.event_id == event_id, EventJudge.user_id == user_id)
    )
    return result.first() is not None


async def list_events_for_judge(db: AsyncSession, user_id: uuid.UUID) -> list[Event]:
    result = await db.exec(
        select(Event)
        .join(EventJudge, EventJudge.event_id == Event.id)
        .where(EventJudge.user_id == user_id)
        .order_by(Event.created_at.desc())
    )
    return list(result.all())
