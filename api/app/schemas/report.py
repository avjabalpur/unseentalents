import uuid
from datetime import datetime

from app.models.enums import ReportStatus, ReportTargetType
from app.schemas.base import CamelModel


class ReportCreate(CamelModel):
    target_type: ReportTargetType
    target_id: uuid.UUID
    reason: str
    notes: str | None = None


class ReportResolve(CamelModel):
    status: ReportStatus


class ReportRead(CamelModel):
    id: uuid.UUID
    reporter_id: uuid.UUID
    reporter_name: str | None = None
    reporter_username: str | None = None
    target_type: ReportTargetType
    target_id: uuid.UUID
    reason: str
    notes: str | None
    status: ReportStatus
    reviewed_by: uuid.UUID | None
    reviewed_at: datetime | None
    created_at: datetime
