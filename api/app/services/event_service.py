import uuid
from datetime import datetime, timezone

from fastapi import status
from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.errors import AppError
from app.models.enums import EventStatus, ParticipationStatus, SubmissionStatus
from app.models.event import Event
from app.models.participation import Participation
from app.models.prize import Prize
from app.models.stage import Stage
from app.models.stage_result import StageResult
from app.models.submission import Submission
from app.models.user import User
from app.schemas.event import EventCreate, EventUpdate
from app.schemas.stage import StageStats
from app.services import stage_service


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


async def get_event_overview_stats(db: AsyncSession, event_id: uuid.UUID) -> dict:
    """Per-stage + event-wide participation/submission breakdown for the admin
    event tracking view: current stage, entries uploaded, and how many advanced
    at each round."""
    stages = await stage_service.list_stages_for_event(db, event_id)
    now = datetime.now(timezone.utc)

    submission_rows = await db.exec(
        select(Submission.stage_id, Submission.status, func.count(Submission.id))
        .join(Stage, Stage.id == Submission.stage_id)
        .where(Stage.event_id == event_id)
        .group_by(Submission.stage_id, Submission.status)
    )
    submission_counts: dict[uuid.UUID, dict[str, int]] = {}
    for stage_id, sub_status, count in submission_rows.all():
        status_key = sub_status.value if hasattr(sub_status, "value") else str(sub_status)
        submission_counts.setdefault(stage_id, {})[status_key] = count

    advanced_rows = await db.exec(
        select(StageResult.stage_id, func.count(StageResult.id))
        .join(Stage, Stage.id == StageResult.stage_id)
        .where(Stage.event_id == event_id, StageResult.advanced.is_(True))
        .group_by(StageResult.stage_id)
    )
    advanced_counts = dict(advanced_rows.all())

    current_rows = await db.exec(
        select(Participation.current_stage_id, func.count(Participation.id))
        .where(Participation.event_id == event_id)
        .group_by(Participation.current_stage_id)
    )
    current_counts = dict(current_rows.all())

    stage_stats: list[StageStats] = []
    for stage in sorted(stages, key=lambda s: s.order_index):
        counts = submission_counts.get(stage.id, {})
        stage_stats.append(
            StageStats(
                stage_id=stage.id,
                name=stage.name,
                order_index=stage.order_index,
                start_at=stage.start_at,
                end_at=stage.end_at,
                closed_at=stage.closed_at,
                is_current=stage.start_at <= now <= stage.end_at,
                submission_count=sum(counts.values()),
                pending_count=counts.get(SubmissionStatus.PENDING_MODERATION.value, 0),
                approved_count=counts.get(SubmissionStatus.APPROVED.value, 0),
                rejected_count=counts.get(SubmissionStatus.REJECTED.value, 0),
                advanced_count=advanced_counts.get(stage.id, 0),
                participants_at_stage=current_counts.get(stage.id, 0),
            )
        )

    participation_status_rows = await db.exec(
        select(Participation.status, func.count(Participation.id))
        .where(Participation.event_id == event_id)
        .group_by(Participation.status)
    )
    status_counts: dict[str, int] = {}
    for part_status, count in participation_status_rows.all():
        status_key = part_status.value if hasattr(part_status, "value") else str(part_status)
        status_counts[status_key] = count

    return {
        "stages": stage_stats,
        "total_participants": sum(status_counts.values()),
        "active_participants": status_counts.get(ParticipationStatus.ACTIVE.value, 0),
        "eliminated_participants": status_counts.get(ParticipationStatus.ELIMINATED.value, 0),
        "winner_count": status_counts.get(ParticipationStatus.WINNER.value, 0),
        "total_submissions": sum(s.submission_count for s in stage_stats),
        "total_pending": sum(s.pending_count for s in stage_stats),
        "total_approved": sum(s.approved_count for s in stage_stats),
        "total_rejected": sum(s.rejected_count for s in stage_stats),
    }
