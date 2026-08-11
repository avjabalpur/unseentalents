import uuid
from datetime import datetime

from app.models.enums import EventStatus
from app.schemas.base import CamelModel
from app.schemas.stage import StageRead, StageStats


class EventCreate(CamelModel):
    name: str
    description: str | None = None
    event_type_id: uuid.UUID


class EventUpdate(CamelModel):
    name: str | None = None
    description: str | None = None
    status: EventStatus | None = None


class EventRead(CamelModel):
    id: uuid.UUID
    name: str
    description: str | None
    event_type_id: uuid.UUID
    status: EventStatus
    created_at: datetime
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
