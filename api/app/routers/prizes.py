import uuid

from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.dependencies import require_role
from app.db import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.prize import PrizeCreate, PrizeRead
from app.services import event_service, prize_service

router = APIRouter(tags=["prizes"])


@router.get("/events/{event_id}/prizes", response_model=list[PrizeRead])
async def list_prizes(event_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await prize_service.list_prizes_for_event(db, event_id)


@router.post("/events/{event_id}/prizes", response_model=PrizeRead)
async def create_prize(
    event_id: uuid.UUID,
    payload: PrizeCreate,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    await event_service.get_event_or_404(db, event_id)
    return await prize_service.create_prize(db, event_id, payload)


@router.delete("/prizes/{prize_id}")
async def delete_prize(
    prize_id: uuid.UUID,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    prize = await prize_service.get_prize_or_404(db, prize_id)
    await prize_service.delete_prize(db, prize)
    return {"success": True}
