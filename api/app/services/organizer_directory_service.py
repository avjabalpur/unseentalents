import uuid

from fastapi import status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.errors import AppError
from app.models.enums import UserRole, UserStatus
from app.models.user import User
from app.schemas.organizer_directory import OrganizerProfileRead, OrganizerPublicRead
from app.services import event_service


async def list_organizers(db: AsyncSession) -> list[OrganizerPublicRead]:
    result = await db.exec(
        select(User).where(User.role == UserRole.ORGANIZER, User.status == UserStatus.ACTIVE).order_by(User.name)
    )
    organizers = result.all()

    reads: list[OrganizerPublicRead] = []
    for organizer in organizers:
        count = await event_service.count_published_events_for_owner(db, organizer.id)
        reads.append(
            OrganizerPublicRead(
                id=organizer.id,
                name=organizer.name,
                username=organizer.username,
                avatar_key=organizer.avatar_key,
                facebook_url=organizer.facebook_url,
                instagram_url=organizer.instagram_url,
                twitter_url=organizer.twitter_url,
                published_event_count=count,
            )
        )
    return reads


async def get_organizer_profile(db: AsyncSession, organizer_id: uuid.UUID) -> OrganizerProfileRead:
    organizer = await db.get(User, organizer_id)
    if organizer is None or organizer.role != UserRole.ORGANIZER or organizer.status != UserStatus.ACTIVE:
        raise AppError("NOT_FOUND", "Organizer not found.", status.HTTP_404_NOT_FOUND)

    events = await event_service.list_published_events_for_owner(db, organizer.id)
    event_reads = [await event_service.to_read(db, event) for event in events]

    return OrganizerProfileRead(
        id=organizer.id,
        name=organizer.name,
        username=organizer.username,
        avatar_key=organizer.avatar_key,
        facebook_url=organizer.facebook_url,
        instagram_url=organizer.instagram_url,
        twitter_url=organizer.twitter_url,
        published_event_count=len(events),
        events=event_reads,
    )
