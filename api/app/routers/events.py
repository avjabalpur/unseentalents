import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.dependencies import CurrentUser, require_role
from app.db import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.event import EventCreate, EventRead, EventUpdate
from app.schemas.participation import ParticipationRead
from app.schemas.stage import StageRead
from app.services import event_service, participation_service, stage_service

router = APIRouter(prefix="/events", tags=["events"])


async def _to_read(db: AsyncSession, event) -> EventRead:
    stages = await stage_service.list_stages_for_event(db, event.id)
    data = EventRead.model_validate(event)
    data.computed_status = event_service.compute_event_status(stages)

    if stages:
        ordered = sorted(stages, key=lambda s: s.order_index)
        data.first_stage_start_at = ordered[0].start_at
        data.final_stage_end_at = ordered[-1].end_at
        now = datetime.now(timezone.utc)
        current = next((s for s in ordered if s.start_at <= now <= s.end_at), None)
        data.current_stage_name = current.name.value if current else None
        data.stages = [StageRead.model_validate(s) for s in ordered]

    return data


@router.get("", response_model=list[EventRead])
async def list_events(db: AsyncSession = Depends(get_db)):
    events = await event_service.list_published_events(db)
    return [await _to_read(db, event) for event in events]


@router.get("/{event_id}", response_model=EventRead)
async def get_event(event_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    event = await event_service.get_event_or_404(db, event_id)
    return await _to_read(db, event)


@router.post("", response_model=EventRead)
async def create_event(
    payload: EventCreate,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    event = await event_service.create_event(db, payload, admin)
    return await _to_read(db, event)


@router.patch("/{event_id}", response_model=EventRead)
async def update_event(
    event_id: uuid.UUID,
    payload: EventUpdate,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    event = await event_service.get_event_or_404(db, event_id)
    updated = await event_service.update_event(db, event, payload)
    return await _to_read(db, updated)


@router.delete("/{event_id}", status_code=204)
async def delete_event(
    event_id: uuid.UUID,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    event = await event_service.get_event_or_404(db, event_id)
    await event_service.delete_event(db, event)


@router.get("/admin/all", response_model=list[EventRead])
async def list_all_events_admin(
    limit: int | None = Query(None, ge=1, le=200),
    offset: int = Query(0, ge=0),
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    events = await event_service.list_all_events(db, limit=limit, offset=offset)
    return [await _to_read(db, event) for event in events]


@router.post("/{event_id}/participate", response_model=ParticipationRead)
async def participate(event_id: uuid.UUID, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    await event_service.get_event_or_404(db, event_id)
    return await participation_service.get_or_create_participation(db, event_id, current_user)


@router.get("/{event_id}/my-participation", response_model=ParticipationRead | None)
async def my_participation(event_id: uuid.UUID, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    return await participation_service.get_participation_for_user(db, event_id, current_user)
