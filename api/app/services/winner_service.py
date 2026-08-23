from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.enums import ParticipationStatus
from app.models.event import Event
from app.models.event_type import EventType
from app.models.participation import Participation
from app.models.submission import Submission
from app.models.user import User
from app.schemas.submission import SubmissionRead
from app.schemas.winner import WinnerRead
from app.services import judge_score_service, submission_service


async def _submission_to_read(db: AsyncSession, submission: Submission) -> SubmissionRead:
    vote_count = await submission_service.count_votes(db, submission.id)
    judge_scores = await judge_score_service.list_scores_for_submission(db, submission.id)
    data = SubmissionRead.model_validate(submission)
    data.vote_count = vote_count
    if judge_scores:
        data.judge_scores = [await judge_score_service.to_read(db, s) for s in judge_scores]
        data.judge_score_total = sum(s.score for s in judge_scores)
    return data


async def list_winners(db: AsyncSession, limit: int | None = None, offset: int = 0) -> list[WinnerRead]:
    query = (
        select(Participation)
        .where(Participation.status == ParticipationStatus.WINNER)
        .order_by(Participation.updated_at.desc())
        .offset(offset)
    )
    if limit is not None:
        query = query.limit(limit)
    result = await db.exec(query)
    participations = result.all()

    winners: list[WinnerRead] = []
    for participation in participations:
        user = await db.get(User, participation.user_id)
        event = await db.get(Event, participation.event_id)
        if user is None or event is None:
            continue
        event_type = await db.get(EventType, event.event_type_id)

        submission_result = await db.exec(
            select(Submission).where(
                Submission.participation_id == participation.id,
                Submission.stage_id == participation.current_stage_id,
            )
        )
        submission = submission_result.first()

        winners.append(
            WinnerRead(
                participation_id=participation.id,
                user_id=user.id,
                user_name=user.name,
                user_username=user.username,
                user_avatar_key=user.avatar_key,
                event_id=event.id,
                event_name=event.name,
                event_type_id=event.event_type_id,
                event_type_name=event_type.name if event_type else "",
                submission=await _submission_to_read(db, submission) if submission else None,
                won_at=participation.updated_at,
            )
        )
    return winners
