import uuid
from datetime import datetime

from app.models.enums import MediaType, ProcessingStatus, SubmissionStatus
from app.schemas.base import CamelModel
from app.schemas.judge_score import JudgeScoreRead


class SubmissionRead(CamelModel):
    id: uuid.UUID
    participation_id: uuid.UUID
    stage_id: uuid.UUID
    media_type: MediaType
    storage_key: str
    thumbnail_key: str | None
    title: str | None
    notes: str | None
    processing_status: ProcessingStatus
    status: SubmissionStatus
    rejection_reason: str | None = None
    uploaded_at: datetime
    vote_count: int = 0
    judge_score_total: float | None = None
    judge_scores: list[JudgeScoreRead] = []
    owner_name: str | None = None
    owner_username: str | None = None
    event_id: uuid.UUID | None = None
    event_name: str | None = None


class BulkModerateRequest(CamelModel):
    submission_ids: list[uuid.UUID]
    approve: bool
    reason: str | None = None
