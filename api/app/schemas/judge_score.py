import uuid
from datetime import datetime

from app.schemas.base import CamelModel

MIN_SCORE = 1
MAX_SCORE = 10


class JudgeScoreSubmit(CamelModel):
    score: int
    comment: str | None = None


class JudgeScoreRead(CamelModel):
    id: uuid.UUID
    submission_id: uuid.UUID
    judge_id: uuid.UUID
    judge_name: str | None = None
    score: int
    comment: str | None
    created_at: datetime
    updated_at: datetime
