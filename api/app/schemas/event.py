import uuid
from datetime import datetime

from app.models.enums import EventStatus, WinningMode
from app.schemas.base import CamelModel
from app.schemas.event_judge import EventJudgeRead
from app.schemas.stage import StageRead, StageStats


class EventCreate(CamelModel):
    name: str
    description: str | None = None
    event_type_id: uuid.UUID
    winning_mode: WinningMode = WinningMode.AUDIENCE_VOTE


class EventUpdate(CamelModel):
    name: str | None = None
    description: str | None = None
    status: EventStatus | None = None
    winning_mode: WinningMode | None = None


class EventRead(CamelModel):
    id: uuid.UUID
    name: str
    description: str | None
    event_type_id: uuid.UUID
    status: EventStatus
    winning_mode: WinningMode
    created_at: datetime
    created_by: uuid.UUID
    creator_name: str | None = None
    creator_role: str | None = None
    judges: list[EventJudgeRead] = []
    computed_status: str | None = None
    current_stage_name: str | None = None
    first_stage_start_at: datetime | None = None
    final_stage_end_at: datetime | None = None
    stages: list[StageRead] = []


class EventOverview(CamelModel):
    event: EventRead
    stages: list[StageStats]
    total_participants: int
    active_participants: int
    eliminated_participants: int
    winner_count: int
    total_submissions: int
    total_pending: int
    total_approved: int
    total_rejected: int
