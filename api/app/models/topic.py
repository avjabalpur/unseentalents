import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from sqlmodel import Field, SQLModel

from app.models.enums import TopicStatus


class Topic(SQLModel, table=True):
    """An admin-authored content page (e.g. "What's New", "About Us"),
    rendered publicly at /pages/{key} and reusable anywhere by key."""

    __tablename__ = "topics"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    key: str = Field(unique=True, index=True)
    title: str
    subtitle: str | None = None
    html_content: str = Field(default="")
    featured: bool = Field(default=False)
    status: TopicStatus = Field(default=TopicStatus.DRAFT)
    created_by: uuid.UUID = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=sa.DateTime(timezone=True))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=sa.DateTime(timezone=True))
