import uuid

from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.dependencies import CurrentUser, Pagination, require_role
from app.core.rate_limit import rate_limiter
from app.db import get_db
from app.models.enums import ReportStatus, UserRole
from app.models.user import User
from app.schemas.report import ReportCreate, ReportRead, ReportResolve
from app.services import report_service

router = APIRouter(tags=["reports"])

_report_rate_limit = rate_limiter("report", limit=10, window_seconds=60)


@router.post("/reports", response_model=ReportRead)
async def create_report(
    payload: ReportCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    _rate_limit: None = Depends(_report_rate_limit),
):
    report = await report_service.create_report(db, payload, current_user)
    return await report_service.to_read(db, report)


@router.get("/admin/reports", response_model=list[ReportRead])
async def list_admin_reports(
    status: ReportStatus | None = None,
    pagination: Pagination = Depends(Pagination),
    actor: User = Depends(require_role(UserRole.ADMIN, UserRole.MODERATOR, UserRole.ORGANIZER)),
    db: AsyncSession = Depends(get_db),
):
    owner_id = actor.id if actor.role == UserRole.ORGANIZER else None
    reports = await report_service.list_reports(db, pagination, status_filter=status, owner_id=owner_id)
    return [await report_service.to_read(db, r) for r in reports]


@router.patch("/admin/reports/{report_id}", response_model=ReportRead)
async def resolve_report(
    report_id: uuid.UUID,
    payload: ReportResolve,
    actor: User = Depends(require_role(UserRole.ADMIN, UserRole.MODERATOR, UserRole.ORGANIZER)),
    db: AsyncSession = Depends(get_db),
):
    report = await report_service.get_report_or_404(db, report_id)
    await report_service.assert_can_resolve(db, report, actor)
    updated = await report_service.resolve_report(db, report, payload.status, actor)
    return await report_service.to_read(db, updated)
