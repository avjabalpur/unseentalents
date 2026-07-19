import uuid

from app.models.enums import MediaType
from app.schemas.base import CamelModel


class EventTypeCreate(CamelModel):
    name: str
    description: str | None = None
    submission_media_type: MediaType = MediaType.VIDEO


class EventTypeRead(CamelModel):
    id: uuid.UUID
    name: str
    description: str | None
    image_key: str | None
    submission_media_type: MediaType
