import uuid

from fastapi import status
from sqlalchemy.exc import IntegrityError
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.errors import AppError
from app.models.enums import SubmissionStatus
from app.models.participation import Participation
from app.models.submission import Submission
from app.models.user import User
from app.models.vote import Vote
from app.services import stage_service


async def cast_vote(db: AsyncSession, submission: Submission, voter: User) -> Vote:
    if submission.status != SubmissionStatus.APPROVED:
        raise AppError(
            "SUBMISSION_NOT_VOTABLE", "This submission isn't open for voting.", status.HTTP_400_BAD_REQUEST
        )

    stage = await stage_service.get_stage_or_404(db, submission.stage_id)
    if not stage_service.is_stage_open(stage):
        raise AppError("STAGE_CLOSED", "Voting for this stage is closed.", status.HTTP_400_BAD_REQUEST)

    vote = Vote(submission_id=submission.id, voter_user_id=voter.id, stage_id=submission.stage_id)
    db.add(vote)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise AppError(
            "DUPLICATE_VOTE", "You've already voted for this submission.", status.HTTP_409_CONFLICT
        ) from exc
    await db.refresh(vote)
    return vote


async def list_votes_for_user(db: AsyncSession, user_id: uuid.UUID) -> list[tuple[Submission, str, uuid.UUID]]:
    """Returns (submission, event_name, event_id) tuples for every submission this user has voted
    for, newest vote first — used by the account "My Votes" page."""
    from app.models.event import Event

    result = await db.exec(
        select(Submission, Event.name, Event.id)
        .select_from(Vote)
        .join(Submission, Submission.id == Vote.submission_id)
        .join(Participation, Participation.id == Submission.participation_id)
        .join(Event, Event.id == Participation.event_id)
        .where(Vote.voter_user_id == user_id)
        .order_by(Vote.created_at.desc())
    )
    return [(row[0], row[1], row[2]) for row in result.all()]
