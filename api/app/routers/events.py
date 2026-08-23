import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.dependencies import CurrentUser, require_role
from app.core.errors import AppError
from app.db import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.event import EventCreate, EventOverview, EventRead, EventUpdate
from app.schemas.event_judge import EventJudgeCreate, EventJudgeRead
from app.schemas.participation import ParticipationRead
from app.services import event_service, judge_service, participation_service, user_service

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[EventRead])
async def list_events(db: AsyncSession = Depends(get_db)):
    events = await event_service.list_published_events(db)
    return [await event_service.to_read(db, event) for event in events]


@router.get("/mine", response_model=list[EventRead])
async def list_my_events(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    events = await event_service.list_events_for_owner(db, current_user.id)
    return [await event_service.to_read(db, event) for event in events]


@router.get("/judging", response_model=list[EventRead])
async def list_events_i_judge(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    events = await judge_service.list_events_for_judge(db, current_user.id)
    return [await event_service.to_read(db, event) for event in events]


@router.get("/{event_id}", response_model=EventRead)
async def get_event(event_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    event = await event_service.get_event_or_404(db, event_id)
    return await event_service.to_read(db, event)


@router.post("", response_model=EventRead)
async def create_event(
    payload: EventCreate,
    actor: User = Depends(require_role(UserRole.ADMIN, UserRole.ORGANIZER)),
    db: AsyncSession = Depends(get_db),
):
    event = await event_service.create_event(db, payload, actor)
    return await event_service.to_read(db, event)


@router.patch("/{event_id}", response_model=EventRead)
async def update_event(
    event_id: uuid.UUID,
    payload: EventUpdate,
    actor: User = Depends(require_role(UserRole.ADMIN, UserRole.ORGANIZER)),
    db: AsyncSession = Depends(get_db),
):
    event = await event_service.get_event_or_404(db, event_id)
    updated = await event_service.update_event(db, event, payload, actor)
    return await event_service.to_read(db, updated)


@router.delete("/{event_id}", status_code=204)
async def delete_event(
    event_id: uuid.UUID,
    actor: User = Depends(require_role(UserRole.ADMIN, UserRole.ORGANIZER)),
    db: AsyncSession = Depends(get_db),
):
    event = await event_service.get_event_or_404(db, event_id)
    await event_service.delete_event(db, event, actor)


@router.get("/{event_id}/overview", response_model=EventOverview)
async def get_event_overview(
    event_id: uuid.UUID,
    admin: User = Depends(require_role(UserRole.ADMIN, UserRole.MODERATOR)),
    db: AsyncSession = Depends(get_db),
):
    event = await event_service.get_event_or_404(db, event_id)
    event_read = await event_service.to_read(db, event)
    stats = await event_service.get_event_overview_stats(db, event_id)
    return EventOverview(event=event_read, **stats)


@router.get("/admin/all", response_model=list[EventRead])
async def list_all_events_admin(
    limit: int | None = Query(None, ge=1, le=200),
    offset: int = Query(0, ge=0),
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    events = await event_service.list_all_events(db, limit=limit, offset=offset)
    return [await event_service.to_read(db, event) for event in events]


@router.post("/{event_id}/participate", response_model=ParticipationRead)
async def participate(event_id: uuid.UUID, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    await event_service.get_event_or_404(db, event_id)
    return await participation_service.get_or_create_participation(db, event_id, current_user)


@router.get("/{event_id}/my-participation", response_model=ParticipationRead | None)
async def my_participation(event_id: uuid.UUID, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    return await participation_service.get_participation_for_user(db, event_id, current_user)


@router.get("/{event_id}/judges", response_model=list[EventJudgeRead])
async def list_event_judges(event_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await event_service.get_event_or_404(db, event_id)
    judges = await judge_service.list_judges_for_event(db, event_id)
    return [await judge_service.to_read(db, j) for j in judges]


@router.post("/{event_id}/judges", response_model=EventJudgeRead)
async def assign_event_judge(
    event_id: uuid.UUID,
    payload: EventJudgeCreate,
    actor: User = Depends(require_role(UserRole.ADMIN, UserRole.ORGANIZER)),
    db: AsyncSession = Depends(get_db),
):
    event = await event_service.get_event_or_404(db, event_id)
    judge_user = await user_service.get_user_or_404(db, payload.user_id)
    judge = await judge_service.assign_judge(db, event, judge_user, actor)
    return await judge_service.to_read(db, judge)


@router.delete("/{event_id}/judges/{judge_id}", status_code=204)
async def remove_event_judge(
    event_id: uuid.UUID,
    judge_id: uuid.UUID,
    actor: User = Depends(require_role(UserRole.ADMIN, UserRole.ORGANIZER)),
    db: AsyncSession = Depends(get_db),
):
    event = await event_service.get_event_or_404(db, event_id)
    judge = await judge_service.get_judge_assignment_or_404(db, judge_id)
    if judge.event_id != event.id:
        raise AppError("NOT_FOUND", "Judge assignment not found.", status.HTTP_404_NOT_FOUND)
    await judge_service.remove_judge(db, event, judge, actor)
