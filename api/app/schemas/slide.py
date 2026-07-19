import uuid
from datetime import datetime

from app.schemas.base import CamelModel


class SlideCreate(CamelModel):
    title: str | None = None
    subtitle: str | None = None
    link_url: str | None = None
    order_index: int = 0
    active: bool = True


class SlideUpdate(CamelModel):
    title: str | None = None
    subtitle: str | None = None
    link_url: str | None = None
    order_index: int | None = None
    active: bool | None = None


class SlideRead(CamelModel):
    id: uuid.UUID
    title: str | None
    subtitle: str | None
    image_key: str
    mobile_image_key: str | None
    link_url: str | None
    order_index: int
    active: bool
    updated_at: datetime
