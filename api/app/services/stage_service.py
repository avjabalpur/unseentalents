import uuid
from datetime import datetime, timezone

from fastapi import status
from sqlalchemy import func
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.authz import assert_owner_or_staff
from app.core.errors import AppError
from app.models.enums import AdvanceMode, ParticipationStatus, SubmissionStatus, WinningMode
from app.models.event import Event
from app.models.judge_score import JudgeScore
from app.models.participation import Participation
from app.models.stage import Stage
from app.models.stage_result import StageResult
from app.models.submission import Submission
from app.models.user import User
from app.models.vote import Vote
from app.schemas.stage import StageCreate
from app.services import activity_log_service


async def _log_stage_outcome(
    db: AsyncSession, stage: Stage, participation_id: uuid.UUID, action: str, actor_id: uuid.UUID | None = None
) -> None:
    result = await db.exec(
        select(Submission.id).where(
            Submission.participation_id == participation_id, Submission.stage_id == stage.id
        )
    )
    submission_id = result.first()
    if submission_id is not None:
        activity_log_service.record(
            db, "SUBMISSION", submission_id, action, actor_id=actor_id, metadata={"stage": stage.name.value}
        )


async def get_stage_or_404(db: AsyncSession, stage_id: uuid.UUID) -> Stage:
    stage = await db.get(Stage, stage_id)
    if stage is None:
        raise AppError("NOT_FOUND", "Stage not found.", status.HTTP_404_NOT_FOUND)
    return stage


async def list_stages_for_event(db: AsyncSession, event_id: uuid.UUID) -> list[Stage]:
    result = await db.exec(select(Stage).where(Stage.event_id == event_id).order_by(Stage.order_index))
    return list(result.all())


async def create_stage(db: AsyncSession, event: Event, data: StageCreate, actor: User) -> Stage:
    assert_owner_or_staff(actor, event.created_by)
    if data.end_at <= data.start_at:
        raise AppError(
            "INVALID_STAGE_WINDOW", "A stage's end time must be after its start time.", status.HTTP_400_BAD_REQUEST
        )
    stage = Stage(event_id=event.id, created_by=event.created_by, **data.model_dump())
    db.add(stage)
    await db.commit()
    await db.refresh(stage)
    return stage


def is_stage_open(stage: Stage, now: datetime | None = None) -> bool:
    now = now or datetime.now(timezone.utc)
    return stage.start_at <= now <= stage.end_at


async def get_first_stage(db: AsyncSession, event_id: uuid.UUID) -> Stage | None:
    result = await db.exec(select(Stage).where(Stage.event_id == event_id).order_by(Stage.order_index).limit(1))
    return result.first()


async def get_next_stage(db: AsyncSession, event_id: uuid.UUID, current_order_index: int) -> Stage | None:
    result = await db.exec(
        select(Stage)
        .where(Stage.event_id == event_id, Stage.order_index > current_order_index)
        .order_by(Stage.order_index)
        .limit(1)
    )
    return result.first()


async def list_stage_results(db: AsyncSession, stage_id: uuid.UUID) -> list[StageResult]:
    result = await db.exec(select(StageResult).where(StageResult.stage_id == stage_id).order_by(StageResult.rank))
    return list(result.all())


async def get_due_stages(db: AsyncSession, now: datetime | None = None) -> list[Stage]:
    now = now or datetime.now(timezone.utc)
    result = await db.exec(select(Stage).where(Stage.end_at <= now, Stage.closed_at.is_(None)))
    return list(result.all())


async def close_stage(db: AsyncSession, stage: Stage, actor: User | None = None) -> list[StageResult]:
    """Tally votes (or judge scores, for JUDGE_SCORE events), materialize StageResult rows,
    and auto-advance top N when configured.

    Only APPROVED submissions are counted; a participation with no approved
    submission for this stage simply has no StageResult row (implicitly out).

    `actor` is None when called by the scheduled stage-close job (system-triggered,
    no ownership check); the manual admin/organizer endpoint always passes it.
    """
    if actor is not None:
        assert_owner_or_staff(actor, stage.created_by)
    if stage.closed_at is not None:
        return []

    event = await db.get(Event, stage.event_id)
    winning_mode = event.winning_mode if event is not None else WinningMode.AUDIENCE_VOTE

    vote_result = await db.exec(
        select(Submission.participation_id, func.count(Vote.id).label("vote_count"))
        .select_from(Submission)
        .join(Vote, Vote.submission_id == Submission.id, isouter=True)
        .where(Submission.stage_id == stage.id, Submission.status == SubmissionStatus.APPROVED)
        .group_by(Submission.participation_id)
    )
    vote_counts: dict[uuid.UUID, int] = {pid: count or 0 for pid, count in vote_result.all()}

    judge_totals: dict[uuid.UUID, float] = {}
    if winning_mode == WinningMode.JUDGE_SCORE:
        judge_result = await db.exec(
            select(Submission.participation_id, func.sum(JudgeScore.score))
            .select_from(Submission)
            .join(JudgeScore, JudgeScore.submission_id == Submission.id, isouter=True)
            .where(Submission.stage_id == stage.id, Submission.status == SubmissionStatus.APPROVED)
            .group_by(Submission.participation_id)
        )
        judge_totals = {pid: float(total) for pid, total in judge_result.all() if total is not None}

    if winning_mode == WinningMode.JUDGE_SCORE:
        ranked = sorted(vote_counts.keys(), key=lambda pid: judge_totals.get(pid, 0.0), reverse=True)
    else:
        ranked = sorted(vote_counts.keys(), key=lambda pid: vote_counts.get(pid, 0), reverse=True)

    stage_results: list[StageResult] = []
    for rank, participation_id in enumerate(ranked, start=1):
        advance = (
            winning_mode != WinningMode.ADMIN_CURATED
            and stage.advance_mode == AdvanceMode.AUTO_TOP_N
            and stage.advance_count is not None
            and rank <= stage.advance_count
        )
        stage_result = StageResult(
            stage_id=stage.id,
            participation_id=participation_id,
            vote_count=vote_counts.get(participation_id, 0),
            judge_score_total=judge_totals.get(participation_id) if winning_mode == WinningMode.JUDGE_SCORE else None,
            rank=rank,
            advanced=advance,
        )
        db.add(stage_result)
        stage_results.append(stage_result)

        if advance:
            participation = await db.get(Participation, participation_id)
            next_stage = await get_next_stage(db, stage.event_id, stage.order_index)
            if next_stage is not None:
                participation.current_stage_id = next_stage.id
                await _log_stage_outcome(db, stage, participation_id, "ADVANCED_STAGE")
            else:
                participation.status = ParticipationStatus.WINNER
                participation.updated_at = datetime.now(timezone.utc)
                await _log_stage_outcome(db, stage, participation_id, "WON")
            db.add(participation)
        else:
            await _log_stage_outcome(db, stage, participation_id, "ELIMINATED")

    stage.closed_at = datetime.now(timezone.utc)
    db.add(stage)
    await db.commit()
    return stage_results


async def advance_participations(
    db: AsyncSession, stage: Stage, participation_ids: list[uuid.UUID], actor: User
) -> None:
    """Admin/organizer-curated advancement: move the selected participations to the next stage."""
    assert_owner_or_staff(actor, stage.created_by)
    actor_id = actor.id
    next_stage = await get_next_stage(db, stage.event_id, stage.order_index)
    for participation_id in participation_ids:
        participation = await db.get(Participation, participation_id)
        if participation is None:
            continue
        if next_stage is not None:
            participation.current_stage_id = next_stage.id
            await _log_stage_outcome(db, stage, participation_id, "ADVANCED_STAGE", actor_id=actor_id)
        else:
            participation.status = ParticipationStatus.WINNER
            participation.updated_at = datetime.now(timezone.utc)
            await _log_stage_outcome(db, stage, participation_id, "WON", actor_id=actor_id)
        db.add(participation)

        result = await db.exec(
            select(StageResult).where(
                StageResult.stage_id == stage.id, StageResult.participation_id == participation_id
            )
        )
        stage_result = result.first()
        if stage_result is not None:
            stage_result.advanced = True
            db.add(stage_result)

    await db.commit()
