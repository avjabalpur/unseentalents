import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from sqlmodel import Field, SQLModel

from app.models.enums import OrganizerApplicationStatus


class OrganizerApplication(SQLModel, table=True):
    __tablename__ = "organizer_applications"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    status: OrganizerApplicationStatus = Field(default=OrganizerApplicationStatus.PENDING, index=True)

    legal_name: str
    address: str
    id_document_type: str
    id_document_number: str
    id_document_key: str
    organization_name: str | None = None
    reason: str | None = None

    rejection_reason: str | None = None
    reviewed_by: uuid.UUID | None = Field(default=None, foreign_key="users.id")
    reviewed_at: datetime | None = Field(default=None, sa_type=sa.DateTime(timezone=True))

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=sa.DateTime(timezone=True))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=sa.DateTime(timezone=True))
