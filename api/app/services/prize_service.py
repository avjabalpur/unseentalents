import uuid

from fastapi import status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.errors import AppError
from app.models.prize import Prize
from app.schemas.prize import PrizeCreate


async def get_prize_or_404(db: AsyncSession, prize_id: uuid.UUID) -> Prize:
    prize = await db.get(Prize, prize_id)
    if prize is None:
        raise AppError("NOT_FOUND", "Prize not found.", status.HTTP_404_NOT_FOUND)
    return prize


async def list_prizes_for_event(db: AsyncSession, event_id: uuid.UUID) -> list[Prize]:
    result = await db.exec(select(Prize).where(Prize.event_id == event_id).order_by(Prize.rank))
    return list(result.all())


async def create_prize(db: AsyncSession, event_id: uuid.UUID, data: PrizeCreate) -> Prize:
    prize = Prize(event_id=event_id, **data.model_dump())
    db.add(prize)
    await db.commit()
    await db.refresh(prize)
    return prize


async def delete_prize(db: AsyncSession, prize: Prize) -> None:
    await db.delete(prize)
    await db.commit()
