import uuid

from app.schemas.base import CamelModel


class PrizeCreate(CamelModel):
    rank: int
    title: str
    reward: str


class PrizeRead(CamelModel):
    id: uuid.UUID
    event_id: uuid.UUID
    rank: int
    title: str
    reward: str
