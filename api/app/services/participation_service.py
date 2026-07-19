import uuid

from fastapi import status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.errors import AppError
from app.models.participation import Participation
from app.models.user import User
from app.services.stage_service import get_first_stage


async def get_participation_for_user(db: AsyncSession, event_id: uuid.UUID, user: User) -> Participation | None:
    result = await db.exec(
        select(Participation).where(Participation.event_id == event_id, Participation.user_id == user.id)
    )
    return result.first()


async def get_or_create_participation(db: AsyncSession, event_id: uuid.UUID, user: User) -> Participation:
    participation = await get_participation_for_user(db, event_id, user)
    if participation is not None:
        return participation

    first_stage = await get_first_stage(db, event_id)
    if first_stage is None:
        raise AppError("EVENT_NOT_READY", "This event has no stages configured yet.", status.HTTP_400_BAD_REQUEST)

    participation = Participation(event_id=event_id, user_id=user.id, current_stage_id=first_stage.id)
    db.add(participation)
    await db.commit()
    await db.refresh(participation)
    return participation


async def get_participation_or_404(db: AsyncSession, participation_id: uuid.UUID) -> Participation:
    participation = await db.get(Participation, participation_id)
    if participation is None:
        raise AppError("NOT_FOUND", "Participation not found.", status.HTTP_404_NOT_FOUND)
    return participation
