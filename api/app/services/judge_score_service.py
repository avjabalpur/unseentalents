import uuid
from datetime import datetime, timezone

from fastapi import status
from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.errors import AppError
from app.models.enums import SubmissionStatus
from app.models.judge_score import JudgeScore
from app.models.submission import Submission
from app.models.user import User
from app.schemas.judge_score import MAX_SCORE, MIN_SCORE, JudgeScoreRead
from app.services import judge_service, stage_service


async def assert_can_score(db: AsyncSession, submission: Submission, judge: User) -> None:
    if submission.status != SubmissionStatus.APPROVED:
        raise AppError(
            "SUBMISSION_NOT_SCORABLE", "This submission isn't open for judging.", status.HTTP_400_BAD_REQUEST
        )
    stage = await stage_service.get_stage_or_404(db, submission.stage_id)
    if not stage_service.is_stage_open(stage):
        raise AppError("STAGE_CLOSED", "Judging for this stage is closed.", status.HTTP_400_BAD_REQUEST)

    is_judge = await judge_service.is_judge_for_event(db, stage.event_id, judge.id)
    if not is_judge:
        raise AppError(
            "NOT_A_JUDGE", "You are not assigned as a judge for this event.", status.HTTP_403_FORBIDDEN
        )


async def submit_score(
    db: AsyncSession, submission: Submission, judge: User, score: int, comment: str | None
) -> JudgeScore:
    if score < MIN_SCORE or score > MAX_SCORE:
        raise AppError(
            "INVALID_SCORE", f"Score must be between {MIN_SCORE} and {MAX_SCORE}.", status.HTTP_400_BAD_REQUEST
        )
    await assert_can_score(db, submission, judge)

    result = await db.exec(
        select(JudgeScore).where(JudgeScore.submission_id == submission.id, JudgeScore.judge_id == judge.id)
    )
    existing = result.first()
    if existing is not None:
        existing.score = score
        existing.comment = comment
        existing.updated_at = datetime.now(timezone.utc)
        db.add(existing)
        await db.commit()
        await db.refresh(existing)
        return existing

    judge_score = JudgeScore(submission_id=submission.id, judge_id=judge.id, score=score, comment=comment)
    db.add(judge_score)
    await db.commit()
    await db.refresh(judge_score)
    return judge_score


async def list_scores_for_submission(db: AsyncSession, submission_id: uuid.UUID) -> list[JudgeScore]:
    result = await db.exec(
        select(JudgeScore).where(JudgeScore.submission_id == submission_id).order_by(JudgeScore.created_at)
    )
    return list(result.all())


async def get_score_total(db: AsyncSession, submission_id: uuid.UUID) -> float | None:
    result = await db.exec(select(func.sum(JudgeScore.score)).where(JudgeScore.submission_id == submission_id))
    total = result.one()
    return float(total) if total is not None else None


async def to_read(db: AsyncSession, judge_score: JudgeScore) -> JudgeScoreRead:
    data = JudgeScoreRead.model_validate(judge_score)
    judge = await db.get(User, judge_score.judge_id)
    if judge is not None:
        data.judge_name = judge.name
    return data
