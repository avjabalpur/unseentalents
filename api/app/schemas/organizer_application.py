import uuid
from datetime import datetime

from app.models.enums import OrganizerApplicationStatus
from app.schemas.base import CamelModel


class OrganizerApplicationResolve(CamelModel):
    status: OrganizerApplicationStatus
    rejection_reason: str | None = None


class OrganizerApplicationRead(CamelModel):
    id: uuid.UUID
    user_id: uuid.UUID
    applicant_name: str | None = None
    applicant_username: str | None = None
    status: OrganizerApplicationStatus
    legal_name: str
    address: str
    id_document_type: str
    id_document_number: str
    organization_name: str | None
    reason: str | None
    rejection_reason: str | None
    reviewed_by: uuid.UUID | None
    reviewer_name: str | None = None
    reviewed_at: datetime | None
    created_at: datetime
