import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from sqlmodel import Field, SQLModel


class Slide(SQLModel, table=True):
    """A hero carousel slide, admin-configured, with separate desktop/mobile images."""

    __tablename__ = "slides"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str | None = None
    subtitle: str | None = None
    image_key: str
    mobile_image_key: str | None = None
    link_url: str | None = None
    order_index: int = Field(default=0)
    active: bool = Field(default=True)
    created_by: uuid.UUID = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=sa.DateTime(timezone=True))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=sa.DateTime(timezone=True))
