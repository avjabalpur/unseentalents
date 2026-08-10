from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.dependencies import require_role
from app.db import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.site_settings import SiteSettingsRead, SiteSettingsUpdate
from app.services import settings_service

router = APIRouter(prefix="/admin/settings", tags=["settings"])


@router.get("", response_model=SiteSettingsRead)
async def get_site_settings(
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    return await settings_service.get_or_create_settings(db)


@router.patch("", response_model=SiteSettingsRead)
async def update_site_settings(
    payload: SiteSettingsUpdate,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    row = await settings_service.get_or_create_settings(db)
    return await settings_service.update_settings(db, row, payload, actor_id=admin.id)
