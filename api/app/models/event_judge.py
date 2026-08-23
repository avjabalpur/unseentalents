import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from sqlmodel import Field, SQLModel, UniqueConstraint


class EventJudge(SQLModel, table=True):
    __tablename__ = "event_judges"
    __table_args__ = (UniqueConstraint("event_id", "user_id", name="uq_event_judge_event_user"),)

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    event_id: uuid.UUID = Field(foreign_key="events.id", index=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    assigned_by: uuid.UUID = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=sa.DateTime(timezone=True))
