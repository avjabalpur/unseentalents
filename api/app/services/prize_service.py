import uuid

from fastapi import status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.authz import assert_owner_or_staff
from app.core.errors import AppError
from app.models.event import Event
from app.models.prize import Prize
from app.models.user import User
from app.schemas.prize import PrizeCreate


async def get_prize_or_404(db: AsyncSession, prize_id: uuid.UUID) -> Prize:
    prize = await db.get(Prize, prize_id)
    if prize is None:
        raise AppError("NOT_FOUND", "Prize not found.", status.HTTP_404_NOT_FOUND)
    return prize


async def list_prizes_for_event(db: AsyncSession, event_id: uuid.UUID) -> list[Prize]:
    result = await db.exec(select(Prize).where(Prize.event_id == event_id).order_by(Prize.rank))
    return list(result.all())


async def create_prize(db: AsyncSession, event: Event, data: PrizeCreate, actor: User) -> Prize:
    assert_owner_or_staff(actor, event.created_by)
    prize = Prize(event_id=event.id, created_by=event.created_by, **data.model_dump())
    db.add(prize)
    await db.commit()
    await db.refresh(prize)
    return prize


async def delete_prize(db: AsyncSession, prize: Prize, actor: User) -> None:
    assert_owner_or_staff(actor, prize.created_by)
    await db.delete(prize)
    await db.commit()
