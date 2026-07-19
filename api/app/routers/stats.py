from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.dependencies import require_role
from app.db import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.stats import AdminStats
from app.services import stats_service

router = APIRouter(tags=["stats"])


@router.get("/admin/stats", response_model=AdminStats)
async def get_admin_stats(
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    return await stats_service.get_admin_stats(db)
