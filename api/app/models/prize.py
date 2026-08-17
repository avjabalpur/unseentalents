import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from sqlmodel import Field, SQLModel


class Prize(SQLModel, table=True):
    __tablename__ = "prizes"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    event_id: uuid.UUID = Field(foreign_key="events.id", index=True)
    created_by: uuid.UUID = Field(foreign_key="users.id")
    rank: int
    title: str
    reward: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=sa.DateTime(timezone=True))
