import uuid
from datetime import datetime, timezone

from fastapi import status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.dependencies import Pagination
from app.core.errors import AppError
from app.models.enums import ReportStatus
from app.models.report import Report
from app.models.user import User
from app.schemas.report import ReportCreate, ReportRead
from app.services import activity_log_service


async def create_report(db: AsyncSession, data: ReportCreate, reporter: User) -> Report:
    report = Report(
        reporter_id=reporter.id,
        target_type=data.target_type,
        target_id=data.target_id,
        reason=data.reason,
        notes=data.notes,
    )
    db.add(report)
    await db.flush()
    activity_log_service.record(
        db,
        data.target_type.value,
        data.target_id,
        "REPORTED",
        actor_id=reporter.id,
        metadata={"reason": data.reason},
    )
    await db.commit()
    await db.refresh(report)
    return report


async def to_read(db: AsyncSession, report: Report) -> ReportRead:
    data = ReportRead.model_validate(report)
    reporter = await db.get(User, report.reporter_id)
    if reporter is not None:
        data.reporter_name = reporter.name
        data.reporter_username = reporter.username
    return data


async def list_reports(db: AsyncSession, pagination: Pagination, status_filter: ReportStatus | None = None) -> list[Report]:
    query = select(Report)
    if status_filter is not None:
        query = query.where(Report.status == status_filter)
    query = query.order_by(Report.created_at.desc()).limit(pagination.limit).offset(pagination.offset)
    result = await db.exec(query)
    return list(result.all())


async def get_report_or_404(db: AsyncSession, report_id: uuid.UUID) -> Report:
    report = await db.get(Report, report_id)
    if report is None:
        raise AppError("NOT_FOUND", "Report not found.", status.HTTP_404_NOT_FOUND)
    return report


async def resolve_report(db: AsyncSession, report: Report, new_status: ReportStatus, admin: User) -> Report:
    report.status = new_status
    report.reviewed_by = admin.id
    report.reviewed_at = datetime.now(timezone.utc)
    db.add(report)
    activity_log_service.record(
        db,
        report.target_type.value,
        report.target_id,
        f"REPORT_{new_status.value}",
        actor_id=admin.id,
    )
    await db.commit()
    await db.refresh(report)
    return report
