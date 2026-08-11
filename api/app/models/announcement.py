import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from sqlmodel import Field, SQLModel


class Announcement(SQLModel, table=True):
    """A dismissible top-of-site banner, admin-scheduled via start/end dates,
    that links out to a configured page when clicked."""

    __tablename__ = "announcements"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    message: str
    button_label: str | None = None
    link_url: str | None = None
    start_at: datetime | None = Field(default=None, sa_type=sa.DateTime(timezone=True))
    end_at: datetime | None = Field(default=None, sa_type=sa.DateTime(timezone=True))
    active: bool = Field(default=True)
    created_by: uuid.UUID = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=sa.DateTime(timezone=True))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=sa.DateTime(timezone=True))
