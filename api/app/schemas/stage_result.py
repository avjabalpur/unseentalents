import uuid

from app.schemas.base import CamelModel


class StageResultRead(CamelModel):
    id: uuid.UUID
    stage_id: uuid.UUID
    participation_id: uuid.UUID
    vote_count: int
    rank: int
    advanced: bool
