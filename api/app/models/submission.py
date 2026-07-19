import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from sqlmodel import Field, SQLModel, UniqueConstraint

from app.models.enums import MediaType, ProcessingStatus, SubmissionStatus


class Submission(SQLModel, table=True):
    __tablename__ = "submissions"
    __table_args__ = (
        UniqueConstraint("participation_id", "stage_id", name="uq_submission_participation_stage"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    participation_id: uuid.UUID = Field(foreign_key="participations.id", index=True)
    stage_id: uuid.UUID = Field(foreign_key="stages.id", index=True)
    media_type: MediaType
    storage_key: str
    thumbnail_key: str | None = None
    title: str | None = None
    notes: str | None = None
    processing_status: ProcessingStatus = Field(default=ProcessingStatus.PENDING)
    status: SubmissionStatus = Field(default=SubmissionStatus.PENDING_MODERATION)
    uploaded_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), sa_type=sa.DateTime(timezone=True)
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=sa.DateTime(timezone=True))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=sa.DateTime(timezone=True))
