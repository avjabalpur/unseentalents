import uuid

from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.dependencies import require_role
from app.db import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.announcement import AnnouncementCreate, AnnouncementRead, AnnouncementUpdate
from app.services import announcement_service

router = APIRouter(prefix="/announcements", tags=["announcements"])


@router.get("", response_model=AnnouncementRead | None)
async def get_active_announcement(db: AsyncSession = Depends(get_db)):
    return await announcement_service.get_active_announcement(db)


@router.get("/admin/all", response_model=list[AnnouncementRead])
async def list_all_announcements(
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    return await announcement_service.list_all_announcements(db)


@router.post("", response_model=AnnouncementRead)
async def create_announcement(
    payload: AnnouncementCreate,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    return await announcement_service.create_announcement(db, payload, admin)


@router.patch("/{announcement_id}", response_model=AnnouncementRead)
async def update_announcement(
    announcement_id: uuid.UUID,
    payload: AnnouncementUpdate,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    announcement = await announcement_service.get_announcement_or_404(db, announcement_id)
    return await announcement_service.update_announcement(db, announcement, payload)


@router.delete("/{announcement_id}")
async def delete_announcement(
    announcement_id: uuid.UUID,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    announcement = await announcement_service.get_announcement_or_404(db, announcement_id)
    await announcement_service.delete_announcement(db, announcement)
    return {"success": True}
