import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from sqlmodel import Field, SQLModel


class ActivityLog(SQLModel, table=True):
    __tablename__ = "activity_logs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    entity_type: str = Field(index=True)
    entity_id: uuid.UUID = Field(index=True)
    actor_id: uuid.UUID | None = Field(default=None, foreign_key="users.id")
    action: str
    log_metadata: dict | None = Field(default=None, sa_type=sa.JSON())
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), sa_type=sa.DateTime(timezone=True), index=True
    )
