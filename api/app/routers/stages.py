import uuid

from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.dependencies import require_role
from app.db import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.stage import AdvanceRequest, StageCreate, StageRead
from app.schemas.stage_result import StageResultRead
from app.services import event_service, stage_service

router = APIRouter(tags=["stages"])


@router.get("/events/{event_id}/stages", response_model=list[StageRead])
async def list_stages(event_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await stage_service.list_stages_for_event(db, event_id)


@router.post("/events/{event_id}/stages", response_model=StageRead)
async def create_stage(
    event_id: uuid.UUID,
    payload: StageCreate,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    await event_service.get_event_or_404(db, event_id)
    return await stage_service.create_stage(db, event_id, payload)


@router.get("/stages/{stage_id}/results", response_model=list[StageResultRead])
async def get_stage_results(stage_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await stage_service.list_stage_results(db, stage_id)


@router.post("/stages/{stage_id}/close", response_model=list[StageResultRead])
async def close_stage_now(
    stage_id: uuid.UUID,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    stage = await stage_service.get_stage_or_404(db, stage_id)
    return await stage_service.close_stage(db, stage)


@router.post("/stages/{stage_id}/advance")
async def advance_stage(
    stage_id: uuid.UUID,
    payload: AdvanceRequest,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    stage = await stage_service.get_stage_or_404(db, stage_id)
    await stage_service.advance_participations(db, stage, payload.participation_ids)
    return {"success": True}
