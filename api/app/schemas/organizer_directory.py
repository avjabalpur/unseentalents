import uuid

from app.schemas.base import CamelModel
from app.schemas.event import EventRead


class OrganizerPublicRead(CamelModel):
    id: uuid.UUID
    name: str
    username: str
    avatar_key: str | None
    facebook_url: str | None
    instagram_url: str | None
    twitter_url: str | None
    published_event_count: int


class OrganizerProfileRead(OrganizerPublicRead):
    events: list[EventRead] = []
