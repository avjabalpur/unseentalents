import uuid
from datetime import datetime

from app.schemas.base import CamelModel


class EventJudgeCreate(CamelModel):
    user_id: uuid.UUID


class EventJudgeRead(CamelModel):
    id: uuid.UUID
    event_id: uuid.UUID
    user_id: uuid.UUID
    judge_name: str | None = None
    judge_username: str | None = None
    created_at: datetime
