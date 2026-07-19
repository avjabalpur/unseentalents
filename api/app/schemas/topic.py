import uuid
from datetime import datetime

from pydantic import Field

from app.models.enums import TopicStatus
from app.schemas.base import CamelModel

KEY_PATTERN = r"^[a-z0-9-]{2,60}$"


class TopicCreate(CamelModel):
    key: str = Field(pattern=KEY_PATTERN)
    title: str
    subtitle: str | None = None
    html_content: str = ""
    featured: bool = False
    status: TopicStatus = TopicStatus.DRAFT


class TopicUpdate(CamelModel):
    title: str | None = None
    subtitle: str | None = None
    html_content: str | None = None
    featured: bool | None = None
    status: TopicStatus | None = None


class TopicRead(CamelModel):
    id: uuid.UUID
    key: str
    title: str
    subtitle: str | None
    html_content: str
    featured: bool
    status: TopicStatus
    updated_at: datetime
