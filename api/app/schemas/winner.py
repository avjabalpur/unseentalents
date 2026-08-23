import uuid
from datetime import datetime

from app.schemas.base import CamelModel
from app.schemas.submission import SubmissionRead


class WinnerRead(CamelModel):
    participation_id: uuid.UUID
    user_id: uuid.UUID
    user_name: str
    user_username: str
    user_avatar_key: str | None
    event_id: uuid.UUID
    event_name: str
    event_type_id: uuid.UUID
    event_type_name: str
    submission: SubmissionRead | None
    won_at: datetime
