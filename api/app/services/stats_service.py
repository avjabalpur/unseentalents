from datetime import datetime

from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.enums import EventStatus, SubmissionStatus
from app.models.event import Event
from app.models.event_type import EventType
from app.models.participation import Participation
from app.models.prize import Prize
from app.models.submission import Submission
from app.models.user import User
from app.models.vote import Vote
from app.schemas.stats import AdminStats, CountItem, PublicSummary


def _to_items(rows) -> list[CountItem]:
    items = []
    for label, count in rows:
        label_str = label.value if hasattr(label, "value") else str(label)
        items.append(CountItem(label=label_str, count=count))
    return items


async def get_admin_stats(
    db: AsyncSession, date_from: datetime | None = None, date_to: datetime | None = None
) -> AdminStats:
    submissions_query = (
        select(Event.name, func.count(Submission.id))
        .select_from(Submission)
        .join(Participation, Participation.id == Submission.participation_id)
        .join(Event, Event.id == Participation.event_id)
    )
    submissions_by_type_query = (
        select(EventType.name, func.count(Submission.id))
        .select_from(Submission)
        .join(Participation, Participation.id == Submission.participation_id)
        .join(Event, Event.id == Participation.event_id)
        .join(EventType, EventType.id == Event.event_type_id)
    )
    submissions_status_query = select(Submission.status, func.count(Submission.id))
    votes_query = (
        select(Event.name, func.count(Vote.id))
        .select_from(Vote)
        .join(Submission, Submission.id == Vote.submission_id)
        .join(Participation, Participation.id == Submission.participation_id)
        .join(Event, Event.id == Participation.event_id)
    )

    if date_from is not None:
        submissions_query = submissions_query.where(Submission.uploaded_at >= date_from)
        submissions_by_type_query = submissions_by_type_query.where(Submission.uploaded_at >= date_from)
        submissions_status_query = submissions_status_query.where(Submission.uploaded_at >= date_from)
        votes_query = votes_query.where(Vote.created_at >= date_from)
    if date_to is not None:
        submissions_query = submissions_query.where(Submission.uploaded_at <= date_to)
        submissions_by_type_query = submissions_by_type_query.where(Submission.uploaded_at <= date_to)
        submissions_status_query = submissions_status_query.where(Submission.uploaded_at <= date_to)
        votes_query = votes_query.where(Vote.created_at <= date_to)

    submissions_by_event = await db.exec(
        submissions_query.group_by(Event.name).order_by(func.count(Submission.id).desc())
    )
    submissions_by_event_type = await db.exec(
        submissions_by_type_query.group_by(EventType.name).order_by(func.count(Submission.id).desc())
    )
    submissions_by_status = await db.exec(submissions_status_query.group_by(Submission.status))
    votes_by_event = await db.exec(votes_query.group_by(Event.name).order_by(func.count(Vote.id).desc()))

    users_by_role = await db.exec(select(User.role, func.count(User.id)).group_by(User.role))

    events_by_status = await db.exec(select(Event.status, func.count(Event.id)).group_by(Event.status))

    return AdminStats(
        submissions_by_event=_to_items(submissions_by_event.all()),
        submissions_by_event_type=_to_items(submissions_by_event_type.all()),
        submissions_by_status=_to_items(submissions_by_status.all()),
        votes_by_event=_to_items(votes_by_event.all()),
        users_by_role=_to_items(users_by_role.all()),
        events_by_status=_to_items(events_by_status.all()),
    )


async def get_public_summary(db: AsyncSession) -> PublicSummary:
    events_count = (
        await db.exec(select(func.count(Event.id)).where(Event.status == EventStatus.PUBLISHED))
    ).one()
    categories_count = (await db.exec(select(func.count(EventType.id)))).one()
    submissions_count = (
        await db.exec(select(func.count(Submission.id)).where(Submission.status == SubmissionStatus.APPROVED))
    ).one()
    prizes_count = (await db.exec(select(func.count(Prize.id)))).one()

    return PublicSummary(
        events_count=events_count,
        categories_count=categories_count,
        submissions_count=submissions_count,
        prizes_count=prizes_count,
    )
