import uuid

from app.schemas.base import CamelModel


class StageResultRead(CamelModel):
    id: uuid.UUID
    stage_id: uuid.UUID
    participation_id: uuid.UUID
    vote_count: int
    judge_score_total: float | None = None
    rank: int
    advanced: bool
