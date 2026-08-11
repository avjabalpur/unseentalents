import uuid
from datetime import datetime

from app.schemas.base import CamelModel


class AnnouncementCreate(CamelModel):
    message: str
    button_label: str | None = None
    link_url: str | None = None
    start_at: datetime | None = None
    end_at: datetime | None = None
    active: bool = True


class AnnouncementUpdate(CamelModel):
    message: str | None = None
    button_label: str | None = None
    link_url: str | None = None
    start_at: datetime | None = None
    end_at: datetime | None = None
    active: bool | None = None


class AnnouncementRead(CamelModel):
    id: uuid.UUID
    message: str
    button_label: str | None
    link_url: str | None
    start_at: datetime | None
    end_at: datetime | None
    active: bool
    created_at: datetime
    updated_at: datetime
