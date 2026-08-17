import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from sqlmodel import Field, SQLModel

from app.models.enums import AdvanceMode, StageName


class Stage(SQLModel, table=True):
    __tablename__ = "stages"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    event_id: uuid.UUID = Field(foreign_key="events.id", index=True)
    created_by: uuid.UUID = Field(foreign_key="users.id")
    name: StageName
    order_index: int
    start_at: datetime = Field(sa_type=sa.DateTime(timezone=True))
    end_at: datetime = Field(sa_type=sa.DateTime(timezone=True))
    advance_mode: AdvanceMode = Field(default=AdvanceMode.ADMIN_CURATED)
    advance_count: int | None = None
    closed_at: datetime | None = Field(default=None, sa_type=sa.DateTime(timezone=True))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=sa.DateTime(timezone=True))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=sa.DateTime(timezone=True))
