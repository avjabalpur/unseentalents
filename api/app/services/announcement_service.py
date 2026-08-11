import uuid
from datetime import datetime, timezone

from fastapi import status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.errors import AppError
from app.models.announcement import Announcement
from app.models.user import User
from app.schemas.announcement import AnnouncementCreate, AnnouncementUpdate


async def get_active_announcement(db: AsyncSession) -> Announcement | None:
    now = datetime.now(timezone.utc)
    result = await db.exec(
        select(Announcement)
        .where(
            Announcement.active.is_(True),
            (Announcement.start_at.is_(None)) | (Announcement.start_at <= now),
            (Announcement.end_at.is_(None)) | (Announcement.end_at >= now),
        )
        .order_by(Announcement.created_at.desc())
        .limit(1)
    )
    return result.first()


async def list_all_announcements(db: AsyncSession) -> list[Announcement]:
    result = await db.exec(select(Announcement).order_by(Announcement.created_at.desc()))
    return list(result.all())


async def get_announcement_or_404(db: AsyncSession, announcement_id: uuid.UUID) -> Announcement:
    announcement = await db.get(Announcement, announcement_id)
    if announcement is None:
        raise AppError("NOT_FOUND", "Announcement not found.", status.HTTP_404_NOT_FOUND)
    return announcement


async def create_announcement(db: AsyncSession, data: AnnouncementCreate, admin: User) -> Announcement:
    announcement = Announcement(**data.model_dump(), created_by=admin.id)
    db.add(announcement)
    await db.commit()
    await db.refresh(announcement)
    return announcement


async def update_announcement(
    db: AsyncSession, announcement: Announcement, data: AnnouncementUpdate
) -> Announcement:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(announcement, field, value)
    announcement.updated_at = datetime.now(timezone.utc)
    db.add(announcement)
    await db.commit()
    await db.refresh(announcement)
    return announcement


async def delete_announcement(db: AsyncSession, announcement: Announcement) -> None:
    await db.delete(announcement)
    await db.commit()
