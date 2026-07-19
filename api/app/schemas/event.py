import uuid

from app.models.enums import EventStatus
from app.schemas.base import CamelModel


class EventCreate(CamelModel):
    name: str
    description: str | None = None
    event_type_id: uuid.UUID


class EventUpdate(CamelModel):
    name: str | None = None
    description: str | None = None
    status: EventStatus | None = None


class EventRead(CamelModel):
    id: uuid.UUID
    name: str
    description: str | None
    event_type_id: uuid.UUID
    status: EventStatus
    computed_status: str | None = None
